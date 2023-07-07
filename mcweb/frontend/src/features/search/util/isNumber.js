export default function isNumber(newValue) {
  return !Number.isNaN(parseFloat(newValue)) && Number.isFinite(newValue);
}
