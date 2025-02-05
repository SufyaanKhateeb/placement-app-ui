import gsap from "gsap";
import { useTheme } from "../theme-provider";
import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import MotionPathPlugin from "gsap/MotionPathPlugin";

const ShapesAnimation = () => {
    return (
        <div className="shapes-animation -z-10 absolute top-0 left-0 w-full overflow-clip">
            <ShapesSvg />
        </div>
    );
};

type Shape = {
    type: string;
    class: string;
    size: number;
};

const ShapesSvg = () => {
    const { theme } = useTheme();
    const svgRef = useRef<SVGSVGElement>(null);

    const strokeColor = theme === "dark" ? "#292524" : "#E3E0DE";
    const fillColor = theme === "dark" ? "hsl(var(--background)" : "#FBFAF9";
    const shapes = useMemo<Array<Shape>>(() => {
        const shapes: Array<Shape> = [];
        for (let i = 0; i < 10; i++) {

            let numberOfShapes = 5;

            // for lines 3 and 4 and 8 and 9 we have only 3 shapes beacuse the length is shorter
            if (i === 3 || i === 4 || i === 8 || i === 9) {
                numberOfShapes = 3;
            }

            while(numberOfShapes--) {
                const shapeNumber = gsap.utils.random(1, 3, 1),
                    shapeSize = gsap.utils.random(0.2, 1, 0.2);

                shapes.push({
                    type: shapeNumber === 1 ? "circle" : shapeNumber === 2 ? "rect" : "triangle",
                    class: `line-${i}-shape`,
                    size: shapeSize,
                });
            }
        }
        return shapes;
    }, []);

    useGSAP(
        () => {
            gsap.registerPlugin(MotionPathPlugin);
            for (let i = 0; i < 10; i++) {
                if (i === 3 || i === 4 || i === 8 || i === 9) {
                    gsap.timeline()
                        .fromTo(`.line-${i}-shape`, { opacity: 0 }, { stagger: { each: 5 }, opacity: 1 }, 0)
                        .to(
                            `.line-${i}-shape`,
                            {
                                motionPath: {
                                    path: `.line-${i}`,
                                    align: `.line-${i}`,
                                    alignOrigin: [0.5, 0.5],
                                    autoRotate: 90,
                                },
                                duration: 15,
                                stagger: { each: 5, repeat: -1 },
                                ease: "none",
                            },
                            0
                        );
                } else {
                    gsap.timeline()
                        .fromTo(`.line-${i}-shape`, { opacity: 0 }, { stagger: { each: 3 }, opacity: 1 }, 0)
                        .from(
                            `.line-${i}-shape`,
                            {
                                motionPath: {
                                    path: `.line-${i}`,
                                    align: `.line-${i}`,
                                    alignOrigin: [0.5, 0.5],
                                    autoRotate: -90,
                                },
                                duration: 15,
                                stagger: { each: 3, repeat: -1 },
                                ease: "none",
                            },
                            0
                        );
                }
            }
        },
        { dependencies: [shapes], scope: svgRef }
    );

    return (
        <svg ref={svgRef} width="1280" height="378" viewBox="0 0 1280 378" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_16_27)">
                <path
                    className="line-0"
                    d="M637.318 326.204C621.679 326.204 478.504 326.204 470.391 326.204C460.25 326.204 454.649 321.947 450.902 318.201C450.841 318.14 293.835 161.134 288.091 155.39C280.85 148.149 279.661 142.145 279.661 137.796C279.661 103.299 279.661 32.2283 279.661 23.9198C279.661 15.6112 270.863 5.46989 266.465 1.4378L265.096 0.242065"
                    stroke={strokeColor}
                />
                <path
                    className="line-1"
                    d="M391.895 377.47C369.451 354.577 321.495 307.625 317.864 304.001C313.426 299.573 310.233 295.251 310.233 290.198C310.27 270.597 310.233 230.363 310.233 226.232C310.233 222.026 309.098 216.354 305.632 212.878C254.347 161.443 151.552 58.3267 150.654 57.3392C147.905 54.3145 147.512 50.0807 147.512 46.2293V1.78347V0"
                    stroke={strokeColor}
                />
                <path
                    className="line-2"
                    d="M315.56 377.752L194.285 256.478C184.319 246.976 181.264 242.442 181.246 234.136C181.19 208.888 181.113 155.933 181.246 146.1C181.379 136.266 177.835 130.666 176.046 129.096L50.1906 1.78348L48.4829 0.0758286"
                    stroke={strokeColor}
                />
                <path
                    className="line-3"
                    d="M0 124.776L138.699 263.475C141.438 265.87 146.917 272.617 146.917 280.444C146.917 288.271 146.917 313.64 146.917 325.346C146.917 330.749 149.356 336.108 154.437 341.19L190.615 377.367"
                    stroke={strokeColor}
                />
                <path
                    className="line-4"
                    d="M0.478027 212.535L31.9519 244.009C35.8336 247.89 36.9352 251.625 36.9352 257.123V377.367"
                    stroke={strokeColor}
                />
                <path
                    className="line-5"
                    d="M675.596 326.204C691.236 326.204 801.496 326.204 809.609 326.204C819.75 326.204 825.351 321.947 829.098 318.201C829.159 318.14 986.165 161.134 991.909 155.39C999.15 148.149 1000.34 142.145 1000.34 137.796C1000.34 103.299 1000.34 32.2283 1000.34 23.9198C1000.34 15.6112 1009.14 5.46989 1013.54 1.4378L1014.9 0.242065"
                    stroke={strokeColor}
                />
                <path
                    className="line-6"
                    d="M888.105 377.47C910.549 354.577 958.505 307.625 962.136 304.001C966.574 299.573 969.767 295.251 969.767 290.198C969.73 270.597 969.767 230.363 969.767 226.232C969.767 222.026 970.902 216.354 974.368 212.878C1025.65 161.443 1128.45 58.3267 1129.35 57.3392C1132.1 54.3145 1132.49 50.0807 1132.49 46.2293V1.78347V0"
                    stroke={strokeColor}
                />
                <path
                    className="line-7"
                    d="M964.44 377.752L1085.71 256.478C1095.68 246.976 1098.74 242.442 1098.75 234.136C1098.81 208.888 1098.89 155.933 1098.75 146.1C1098.62 136.266 1102.17 130.666 1103.95 129.096L1229.81 1.78348L1231.52 0.0758286"
                    stroke={strokeColor}
                />
                <path
                    className="line-8"
                    d="M1280 124.776L1141.3 263.475C1138.56 265.87 1133.08 272.617 1133.08 280.444C1133.08 288.271 1133.08 313.64 1133.08 325.346C1133.08 330.749 1130.64 336.108 1125.56 341.19L1089.38 377.367"
                    stroke={strokeColor}
                />
                <path
                    className="line-9"
                    d="M1279.52 212.535L1248.05 244.009C1244.17 247.89 1243.06 251.625 1243.06 257.123V377.367"
                    stroke={strokeColor}
                />
                {shapes.map((shape) => {
                    if (shape.type === "circle") {
                        return <circle className={shape.class} cx="10" cy="10" r="9.5" fill={fillColor} stroke={strokeColor} />;
                    }
                    if (shape.type === "rect") {
                        return (
                            <rect
                                className={shape.class}
                                x="0.5"
                                y="0.5"
                                width="19"
                                height="19"
                                rx="4.5"
                                fill={fillColor}
                                stroke={strokeColor}
                            />
                        );
                    }
                    return (
                        <path
                            className={shape.class}
                            d="M10.433 1.75L17.3612 13.75C17.5537 14.0833 17.3131 14.5 16.9282 14.5H3.0718C2.6869 14.5 2.44633 14.0833 2.63878 13.75L9.56699 1.75C9.75944 1.41667 10.2406 1.41667 10.433 1.75Z"
                            fill={fillColor}
                            stroke={strokeColor}
                            transform="rotate(90 0 0)"
                        />
                    );
                })}
            </g>
            <defs>
                <clipPath id="clip0_16_27">
                    <rect width="1280" height="377.752" rx="30" fill="yellow" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default ShapesAnimation;
