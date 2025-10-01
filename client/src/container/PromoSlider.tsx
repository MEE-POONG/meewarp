// components/PromoSlider.tsx
'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';

type Item = { src: string; alt?: string };

export default function PromoSlider({
  items,
  vertical = false,
  effect = 'fade',
  className='relative overflow-hidden',
}: {
  items: Item[];
  vertical?: boolean;
  effect?: 'fade' | 'slide';
  className?: string;
}) {
  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      direction={vertical ? 'vertical' : 'horizontal'}
      effect={effect}
      autoplay={{ delay: 20000, disableOnInteraction: false, pauseOnMouseEnter: true }}
      speed={600}
      loop
      className={`${vertical ? 'h-full' : 'w-full'} ${className}`}
    >
      {items.map((it, i) => (
        <SwiperSlide key={i} className="">
          <img
            src={it.src}
            alt={it.alt ?? `promo-${i}`}
            className="h-full w-full object-cover rounded-lg"
            loading="lazy"
            decoding="async"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
