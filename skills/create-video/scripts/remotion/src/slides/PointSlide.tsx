import { AbsoluteFill } from "remotion";
import type { DeepSlide, VideoItem } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn, KenBurnsImage } from "../utils";
import { SidePanel } from "../components/SidePanel";
import { DataVizOverlay } from "../components/dataviz/DataVizOverlay";

export const PointSlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || null;
  const isMultiRegion =
    slide.layout === "multi-region" &&
    slide.sidePanel &&
    slide.sidePanel.length > 0;

  // Multi-region layout: main content (72%) + side panel (28%)
  if (isMultiRegion) {
    return (
      <AbsoluteFill style={{ backgroundColor: COLORS.cream, display: "flex" }}>
        <div style={{ width: "72%", height: "100%", display: "flex" }}>
          {imageSource ? (
            <>
              <div
                style={{ width: "55%", height: "100%", overflow: "hidden" }}
              >
                <KenBurnsImage
                  src={imageSource}
                  slideDuration={slideDuration}
                />
              </div>
              <div
                style={{
                  width: "45%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "48px 40px 48px 36px",
                }}
              >
                <SpringIn>
                  <div
                    style={{
                      width: 32,
                      height: 3,
                      backgroundColor: COLORS.amber,
                      borderRadius: 2,
                      marginBottom: 24,
                    }}
                  />
                </SpringIn>
                <SpringIn delay={6}>
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 26,
                      color: COLORS.charcoal,
                      lineHeight: 1.6,
                    }}
                  >
                    {slide.text}
                  </div>
                </SpringIn>
                {slide.subText && (
                  <SpringIn delay={14}>
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 18,
                        color: COLORS.midGray,
                        marginTop: 16,
                      }}
                    >
                      {slide.subText}
                    </div>
                  </SpringIn>
                )}
                {slide.dataViz && (
                  <DataVizOverlay elements={slide.dataViz} delay={18} />
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 80,
              }}
            >
              <SpringIn style={{ width: "100%", maxWidth: 800 }}>
                <div
                  style={{
                    borderLeft: `4px solid ${COLORS.amber}`,
                    paddingLeft: 32,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 30,
                      color: COLORS.charcoal,
                      lineHeight: 1.6,
                    }}
                  >
                    {slide.text}
                  </div>
                  {slide.subText && (
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 18,
                        color: COLORS.midGray,
                        marginTop: 16,
                      }}
                    >
                      {slide.subText}
                    </div>
                  )}
                  {slide.dataViz && (
                    <DataVizOverlay elements={slide.dataViz} delay={14} />
                  )}
                </div>
              </SpringIn>
            </div>
          )}
        </div>
        <div style={{ width: "28%", height: "100%" }}>
          <SidePanel
            items={slide.sidePanel!}
            activeIndex={slide.sidePanel!.findIndex((p) =>
              slide.text.includes(p.slice(0, 10)),
            )}
            durationInFrames={slideDuration}
          />
        </div>
      </AbsoluteFill>
    );
  }

  // Standard full layout (unchanged behavior)
  if (!imageSource) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
        <SpringIn style={{ width: "100%", maxWidth: 1100 }}>
          <div
            style={{
              borderLeft: `4px solid ${COLORS.amber}`,
              paddingLeft: 40,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 36,
                color: COLORS.charcoal,
                lineHeight: 1.6,
              }}
            >
              {slide.text}
            </div>
            {slide.subText && (
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 22,
                  color: COLORS.midGray,
                  marginTop: 20,
                }}
              >
                {slide.subText}
              </div>
            )}
            {slide.dataViz && (
              <DataVizOverlay elements={slide.dataViz} delay={12} />
            )}
          </div>
        </SpringIn>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, display: "flex" }}>
      <div style={{ width: "60%", height: "100%", overflow: "hidden" }}>
        <KenBurnsImage src={imageSource} slideDuration={slideDuration} />
      </div>
      <div
        style={{
          width: "40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px 60px 48px",
        }}
      >
        <SpringIn>
          <div
            style={{
              width: 40,
              height: 3,
              backgroundColor: COLORS.amber,
              borderRadius: 2,
              marginBottom: 28,
            }}
          />
        </SpringIn>
        <SpringIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 30,
              color: COLORS.charcoal,
              lineHeight: 1.6,
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={14}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 20,
                color: COLORS.midGray,
                marginTop: 20,
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
        {slide.dataViz && (
          <DataVizOverlay elements={slide.dataViz} delay={18} />
        )}
      </div>
    </AbsoluteFill>
  );
};
