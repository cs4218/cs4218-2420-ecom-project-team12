import { hashPassword } from "../../helpers/authHelper";
import userModel from "../../models/userModel";
import { ALPHABET, ALPHANUMERIC, NUMBERS, generateRandomText as gen } from "./utils";

export const generateSampleUserProps = () => {
  const name = gen(ALPHANUMERIC) + ' ' + gen(ALPHANUMERIC);
  const email = `${gen(ALPHABET, 10)}@${gen(ALPHABET, 5)}.${gen(ALPHABET, 3)}`;
  const password = gen(ALPHANUMERIC, 10);
  const phone = '+' + gen(NUMBERS, 10);
  const address = `${gen(ALPHANUMERIC, 10)} ${gen(NUMBERS, 5)}`;
  const answer = gen(ALPHANUMERIC, 10);
  return { name, email, password, phone, address, answer };
}

export const createSampleUser = async (role) => {
  if (role === undefined) {
    role = 0;
  }

  const props = generateSampleUserProps()
  const { name, email, password, phone, address, answer } = props;

  const model = userModel({
    name,
    email,
    password: await hashPassword(password),
    phone,
    address,
    answer,
    role,
  });

  await model.save();

  props._id = model._id;
  props.role = role;

  return props;
}
