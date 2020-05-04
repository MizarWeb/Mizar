import FeatureStyle from "../src/Renderer/FeatureStyle";

const whiteArr = [1.0, 1.0, 1.0, 1.0];
const redArr = [1.0, 0.0, 0.0, 1.0];

describe("Color tests", () => {
  it("litteral should be equal", () => {
    const white = FeatureStyle.fromStringToColor("white");
    expect(whiteArr).toStrictEqual(white);

    const red = FeatureStyle.fromStringToColor("red");
    expect(redArr).toStrictEqual(red);
  });

  it("hexa should be equal", () => {
    const white = FeatureStyle.fromStringToColor("#ffffff");
    expect(whiteArr).toStrictEqual(white);

    const red = FeatureStyle.fromStringToColor("#ff0000");
    expect(redArr).toStrictEqual(red);
  });

  it("rgb should be equal", () => {
    const white = FeatureStyle.fromStringToColor("rgb(255,255,255)");
    expect(whiteArr).toStrictEqual(white);

    const red = FeatureStyle.fromStringToColor("rgb(255,0,0)");
    expect(redArr).toStrictEqual(red);
  });

  it("rgba should be equal", () => {
    const white = FeatureStyle.fromStringToColor("rgba(255,255,255,0)");
    expect([1.0, 1.0, 1.0, 0.0]).toStrictEqual(white);

    const red = FeatureStyle.fromStringToColor("rgba(255,0,0,0)");
    expect([1.0, 0.0, 0.0, 0.0]).toStrictEqual(red);
  });
});
