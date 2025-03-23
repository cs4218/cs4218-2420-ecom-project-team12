const capitalizeWord = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const createSuccessTemplate = (entity) => `New ${entity} created.`;
const getSuccessTemplate =  (entity, slug) => `Single ${entity} with slug ${slug} found.`;
const getFailTemplate =  (entity, slug) => `Single ${entity} with slug ${slug} not found.`;
const existsErrorTemplate = (entity) => `${capitalizeWord(entity)} already exists.`;
const genericErrorTemplate = (action) => `Error while ${action}.`;
const genericCreatingErrorTemplate = (entity) => `Error while creating ${entity}.`;
const ENTITY = {
    CATEGORY: "category",
    NAME: "name",
    SLUG: "slug",
};

export const HTTP_MESSAGES = {
    CATEGORY: {
        CREATE : {
            SUCCESS : createSuccessTemplate(ENTITY.CATEGORY),
            ALREADY_EXISTS : existsErrorTemplate(ENTITY.CATEGORY),
            GENERIC_ERROR: genericCreatingErrorTemplate(ENTITY.CATEGORY),
        },
        GETALL : {
            SUCCESS : `All ${ENTITY.CATEGORY}s fetched.`,
            GENERIC_ERROR: genericErrorTemplate("getting all categories"),
        },
        GET : {
            SUCCESS : (slug) => getSuccessTemplate(ENTITY.CATEGORY, slug),
            NOT_FOUND : (slug) => getFailTemplate(ENTITY.CATEGORY, slug),
            SUCCESS : `${capitalizeWord(ENTITY.CATEGORY)} fetched.`,
            GENERIC_ERROR: genericErrorTemplate("getting single category"),
        },
        UPDATE : {
            SUCCESS : `Category updated successfully.`,
            NOT_FOUND : (id) => `Category with id ${id} not found`,
            GENERIC_ERROR: genericErrorTemplate("updating category"),
        },
        DELETE : {
            SUCCESS : `Category deleted successfully.`,
            NOT_FOUND : (id) => `Category with id ${id} not found`,
            GENERIC_ERROR: genericErrorTemplate("deleting category"),
        },
    },
    NAME : {
        REQUIRED : `${capitalizeWord(ENTITY.NAME)} is required`,
        EMPTY_STRING : `${capitalizeWord(ENTITY.NAME)} is empty string when slugified`,
    }
    // ERROR: {
    //     CREATE_CATEGORY: generateGenericErrorMessage("creating category"),
    //     GET_ALL_CATEGORIES: generateGenericErrorMessage("getting all categories"),
    //     GET_SINGLE_CATEGORY: generateGenericErrorMessage("getting single category"),
    //     UPDATE_CATEGORY: generateGenericErrorMessage("updating category"),
    //     DELETE_CATEGORY: generateGenericErrorMessage("deleting category"),
    // },
};