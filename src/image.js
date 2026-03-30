// Copyright 2023 Ju Yuwol <ju@yuwol.pe.kr>
// SPDX-License-Identifier: Zlib

const WIDTH      = 900; // Max side value of Twitter card
const MIN_HEIGHT = 472; // 52.356% (Twitter card's ratio) of 900px

export class ImageBuilder {
  static generate(CanvasKit, fonts, style, message) {
    const builder = new this(CanvasKit, fonts, style);
    const image = builder.generate(message);
    builder.free();
    return image;
  }

  constructor(CanvasKit, fonts, style) {
    const { fontSize, lineHeight, horizontalFrameThickness, verticalFrameThickness } = style;
    const backgroundColor = CanvasKit.Color(...style.backgroundColor);
    const fontMgr = CanvasKit.FontMgr.FromData(fonts);
    this.CanvasKit = CanvasKit;
    this.fontMgr = fontMgr;
    this.halfLeading = fontSize * (lineHeight - 1) / 2;
    this.horizontalFrameThickness = horizontalFrameThickness;
    this.verticalFrameThickness = verticalFrameThickness;
    this.contentLeft = style.contentLeft;
    this.minContentTop = style.minContentTop;
    this.style = new CanvasKit.ParagraphStyle({
      textAlign: CanvasKit.TextAlign.Center,
      textStyle: {
        color: CanvasKit.Color(...style.textColor),
        fontFamilies: fonts.map((_, i) => fontMgr.getFamilyName(i)),
        fontSize,
        heightMultiplier: lineHeight,
      },
    });

    if ((horizontalFrameThickness > 0) || (verticalFrameThickness > 0)) {
      const { frameLeft, frameTop } = style;
      const hasFrameMargin = (frameLeft > 0) || (frameTop > 0);
      const frameColor = CanvasKit.Color(...style.frameColor);
      const backgroundPaint = new CanvasKit.Paint();
      backgroundPaint.setColor(backgroundColor);
      this.frameLeft = frameLeft;
      this.frameTop = frameTop;
      this.canvasColor = hasFrameMargin ? backgroundColor : frameColor;
      this.backgroundPaint = backgroundPaint;
      if (hasFrameMargin) {
        const framePaint = new CanvasKit.Paint();
        framePaint.setColor(frameColor);
        this.framePaint = framePaint;
      } else {
        this.framePaint = null;
      }
    } else {
      this.frameLeft = 0;
      this.frameTop = 0;
      this.canvasColor = backgroundColor;
      this.backgroundPaint = null;
      this.framePaint = null;
    }
  }

  generate(text) {
    const { CanvasKit, contentLeft, minContentTop, backgroundPaint } = this;
    const builder = CanvasKit.ParagraphBuilder.Make(this.style, this.fontMgr);
    builder.addText(text.trim().replace(/[ \t]+/g, ' ').replaceAll(/ \n|\n /g, '\n'));

    const content = builder.build();
    content.layout(WIDTH - (contentLeft * 2));

    const contentHeight = content.getHeight();
    const height = Math.max(MIN_HEIGHT, contentHeight + this.halfLeading + (minContentTop * 2));
    const surface = CanvasKit.MakeSurface(WIDTH, height);
    const canvas = surface.getCanvas();

    canvas.clear(this.canvasColor);
    if (backgroundPaint !== null) {
      const { frameLeft, frameTop, framePaint } = this;
      if (framePaint !== null) {
        const right = WIDTH - frameLeft;
        const bottom = height - frameTop;
        canvas.drawRect4f(frameLeft, frameTop, right, bottom, framePaint);
      }
      const left = frameLeft + this.verticalFrameThickness;
      const top = frameTop + this.horizontalFrameThickness;
      const right = WIDTH - left;
      const bottom = height - top;
      canvas.drawRect4f(left, top, right, bottom, backgroundPaint);
    }

    const top = (height > MIN_HEIGHT) ? minContentTop : ((height - contentHeight) / 2);
    canvas.drawParagraph(content, contentLeft, top);

    const image = surface.makeImageSnapshot();
    const bytes = image.encodeToBytes();
    bytes.width = image.width();
    bytes.height = image.height();

    // Free up memory
    surface.delete();
    image.delete();
    content.delete();
    builder.delete();

    return bytes;
  }

  /** Free up memory */
  free() {
    this.fontMgr.delete();
    this.backgroundPaint?.delete();
    this.framePaint?.delete();
  }
}
