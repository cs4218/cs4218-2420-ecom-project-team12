import categoryModel from "../../models/categoryModel";
import { ALPHANUMERIC, generateRandomText as gen } from "./utils";

export const generateSampleCategoryProps = () => {
  const name = gen(ALPHANUMERIC + ' ', 10);
  const slug = `autotest-${name}`.replace(/ /g, '-');

  return { name, slug };
};

export const createSampleCategory = async () => {
  const props = generateSampleCategoryProps();

  const category = new categoryModel(props);
  await category.save();

  props._id = category._id;

  return props;
}


