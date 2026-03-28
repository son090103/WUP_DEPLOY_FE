import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Side2: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    KHUYẾN MÃI
                </h2>
                <div className="w-20 sm:w-24 h-1 bg-yellow-400 mx-auto rounded-full" />
            </div>

            {/* Cards */}
            <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                            {/* Image */}
                            <img
                                src={`./images/Image${item}.png`}
                                alt={`Promo ${item}`}
                                className="
                                    w-full
                                    h-[220px]
                                    sm:h-[260px]
                                    md:h-[300px]
                                    object-cover
                                "
                            />

                            {/* Button */}
                            <a
                                href="#"
                                className="
                                    absolute
                                    bottom-5
                                    right-1
                                    -translate-x-1/2
                                    z-10
                                    inline-flex
                                    items-center
                                    px-4
                                    py-2
                                    bg-yellow-400
                                    hover:bg-yellow-500
                                    text-gray-900
                                    font-semibold
                                    text-sm
                                    sm:text-base
                                    rounded-full
                                    shadow-md
                                    transition-all
                                    duration-300
                                    hover:scale-105
                                "
                            >
                                View More →
                            </a>
                        </div>
                    ))}
                </div>

                {/* Arrows (ẩn mobile) */}
                <button className="
                    hidden md:flex
                    absolute
                    -left-4
                    top-1/2
                    -translate-y-1/2
                    bg-white
                    p-2
                    rounded-full
                    shadow
                    hover:bg-gray-100
                ">
                    <ChevronLeft />
                </button>

                <button className="
                    hidden md:flex
                    absolute
                    -right-4
                    top-1/2
                    -translate-y-1/2
                    bg-white
                    p-2
                    rounded-full
                    shadow
                    hover:bg-gray-100
                ">
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
};

export default Side2;
