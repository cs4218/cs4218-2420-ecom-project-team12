import productModel from "../../models/productModel";
import {
  ALPHABET,
  ALPHANUMERIC,
  generateRandomText as gen,
  generateRandomInteger as genInt,
  generateRandomBoolean as genBool,
} from "./utils";

export const generateSampleProductProps = (categoryId) => {
  if (!categoryId) throw new Error("A category ID is required for the product");

  const name = gen(ALPHABET + ' ', 10);
  const slug = `autotest-${name}`.replace(/ /g, '-');
  const randomSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24">` +
    `<rect width="100%" height="100%" fill="#${gen("0123456789abcdef", 6)}"/>` +
    `</svg>`
  );

  return {
    name,
    slug,
    description: gen(ALPHANUMERIC + ' ', 50),
    price: genInt(100, 10000) / 100,
    category: categoryId,
    quantity: genInt(1, 10),
    photo: {
      data: randomSvg,
      contentType: 'image/svg+xml'
    },
    shipping: genBool(),
  };
}

export const createSampleProduct = async (categoryIds) => {
  const props = generateSampleProductProps(categoryIds);

  const product = new productModel(props);
  await product.save();

  props._id = product._id;

  return props;
}
