import "@testing-library/jest-dom";

// Global framer-motion mock
jest.mock("framer-motion", () => {
  const React = require("react");
  const dummyMotionValue = {
    get: () => 0,
    set: () => {},
    onChange: () => () => {},
  };

  const motionKeys = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "whileInView",
    "viewport",
    "layout",
  ]);

  const createComponent = (tag) => {
    const Comp = React.forwardRef(({ children, ...props }, ref) => {
      const validProps = {};
      for (const [key, value] of Object.entries(props)) {
        if (!motionKeys.has(key)) {
          validProps[key] = value;
        }
      }
      return React.createElement(tag, { ref, ...validProps }, children);
    });
    Comp.displayName = `MockMotion(${String(tag)})`;
    return Comp;
  };

  const motion = new Proxy(
    {},
    {
      get: (_target, prop) => createComponent(prop),
    }
  );

  return {
    motion,
    AnimatePresence: ({ children }) => children,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: dummyMotionValue }),
    useTransform: () => dummyMotionValue,
    useSpring: () => dummyMotionValue,
  };
});
