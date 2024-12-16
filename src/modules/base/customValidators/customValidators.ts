const isString = (value: any) => {
  if (typeof value !== "string") {
    throw new Error("value should be a string");
  }
  return true;
};

const isEmpty = (value: any) => {
  if (value === null || value === "" || value === undefined) {
    throw new Error("value should not be empty");
  }
  return true;
};

const isNotEmptyAndString = (value: any) => {
  if (value === null || value === "" || value === undefined) {
    throw new Error("value should not be empty");
  }
  if (typeof value !== "string") {
    throw new Error("value should be a string");
  }

  return true;
};

export default { isString, isEmpty, isNotEmptyAndString };
