import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import { HTTP_MESSAGES } from "../utils/constants/httpMessages.js";
import { fail } from "assert";

const failureResponse = (res, errorCode, message) => {
  return res.status(errorCode).send({
    success: false,
    message,
  });
}
const unknownErrorRespone = (res, error, message) => {
  console.log(error);
  return res.status(500).send({
    success: false,
    error,
    message,
  });
}

export const createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return failureResponse(res, 400, HTTP_MESSAGES.NAME.REQUIRED);
    }
    const slug = slugify(name);
    if (!slug) { 
      return failureResponse(res, 400, HTTP_MESSAGES.NAME.EMPTY_STRING);
    }
    const existingCategory = await categoryModel.findOne({ name });
    if (existingCategory) {
      return failureResponse(res, 409, HTTP_MESSAGES.CATEGORY.CREATE.ALREADY_EXISTS);
    }
    const category = await new categoryModel({
      name,
      slug: slugify(name),
    }).save();
    res.status(201).send({
      success: true,
      message: HTTP_MESSAGES.CATEGORY.CREATE.SUCCESS,
      category,
    });
  } catch (error) {
    unknownErrorRespone(res, error, HTTP_MESSAGES.CATEGORY.CREATE.GENERIC_ERROR);
  }
};

//update category
export const updateCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return failureResponse(res, 400, HTTP_MESSAGES.NAME.REQUIRED);
    }
    const slug = slugify(name);
    if (!slug) { 
      return failureResponse(res, 400, HTTP_MESSAGES.NAME.EMPTY_STRING);
    }
    const { id } = req.params;
    const category = await categoryModel.findByIdAndUpdate(
      id,
      { name, slug: slugify(name) },
      { new: true }
    );

    if(!category) {
      failureResponse(res, 404, HTTP_MESSAGES.CATEGORY.UPDATE.NOT_FOUND(id));
    }

    res.status(200).send({
      success: true,
      message: HTTP_MESSAGES.CATEGORY.UPDATE.SUCCESS,
      category,
    });
  } catch (error) {
    unknownErrorRespone(res, error, HTTP_MESSAGES.CATEGORY.UPDATE.GENERIC_ERROR);
  }
};

// get all cat
export const categoryControlller = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    res.status(200).send({
      success: true,
      message: HTTP_MESSAGES.CATEGORY.GETALL.SUCCESS,
      category,
    });
  } catch (error) {
    console.log(error);
    unknownErrorRespone(res, error, HTTP_MESSAGES.CATEGORY.GETALL.GENERIC_ERROR);
  }
};

// single category
export const singleCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if(!category) {
      failureResponse(res, 404, HTTP_MESSAGES.CATEGORY.GET.NOT_FOUND(req.params.slug));
    }
    res.status(200).send({
      success: true,
      message: HTTP_MESSAGES.CATEGORY.GET.SUCCESS,
      category,
    });
  } catch (error) {
    unknownErrorRespone(res, error, HTTP_MESSAGES.CATEGORY.GET.GENERIC_ERROR);
  }
};

//delete category
export const deleteCategoryCOntroller = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await categoryModel.findByIdAndDelete(id);
    if(!deletedCategory) {
      failureResponse(res, 404, HTTP_MESSAGES.CATEGORY.DELETE.NOT_FOUND(id));
    }
    res.status(200).send({
      success: true,
      message: HTTP_MESSAGES.CATEGORY.DELETE.SUCCESS,
    });
  } catch (error) {
    unknownErrorRespone(res, error, HTTP_MESSAGES.CATEGORY.DELETE.GENERIC_ERROR);
  }
};