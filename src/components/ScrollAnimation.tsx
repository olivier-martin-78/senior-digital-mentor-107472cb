
import { useEffect, useRef } from 'react';

const ScrollAnimation = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    };

    observerRef.current = new IntersectionObserver(callback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    // Elements for general scroll animations
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Special animations for feminine style elements
    const feminineCards = document.querySelectorAll('.feminine-card-enter');
    feminineCards.forEach((element, index) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
        // Add staggered animation delay
        element.setAttribute('data-delay', (index * 0.1).toString());
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return null;
};

export default ScrollAnimation;
