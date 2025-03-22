import orderModel from "../../models/orderModel";
import { generateRandomInteger, generateRandomBoolean, pickRandomItem } from "./utils";

export const generateSampleOrderProps = (userId, productIds, status = null) => {
  if (!userId) {
    throw new Error("An associated buyer ID is required");
  }
  if (!productIds || !Array.isArray(productIds)) {
    throw new Error("An array of product IDs ordered is required");
  }

  if (!status) status = pickRandomItem(["Not Process", "Processing", "Shipped", "deliverd", "cancel"]);

  return {
    products: productIds,
    payment: {
      message: "Automated testing generated order",
      success: generateRandomBoolean(),
    },
    buyer: userId,
    status
  };
}

export const createSampleOrder = async (userId, productIds, status = null) => {
  const props = generateSampleOrderProps(userId, productIds, status);

  const model = orderModel(props);
  await model.save();

  props._id = model._id;
  props.createdAt = model.createdAt;
  props.updatedAt = model.updatedAt;

  return props;
}


