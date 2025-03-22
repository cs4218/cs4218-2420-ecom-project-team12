
export const ALPHABET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const ALPHABET_UPPER = ALPHABET_LOWER.toUpperCase();
export const ALPHABET = `${ALPHABET_LOWER}${ALPHABET_UPPER}`;
export const NUMBERS = '0123456789';
export const ALPHANUMERIC = `${ALPHABET}${NUMBERS}`;

export const generateRandomText = (characterSample, length) => {
  if (length === undefined) {
    length = Math.floor(Math.random() * 10) + 1;
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += characterSample.charAt(Math.floor(Math.random() * characterSample.length));
  }
  return result;
}

export const generateRandomNumber = (min, max) => {
  return Math.random() * (max - min) + min;
}

export const generateRandomInteger = (min, max) => {
  return Math.floor(generateRandomNumber(min, max));
}

export const generateRandomBoolean = () => {
  return Math.random() < 0.5;
}

export const pickRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
}
