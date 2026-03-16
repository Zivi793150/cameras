import React, { useEffect, useRef, useState } from 'react';

// Простой автономный слайдер без внешних зависимостей
// Поддерживает авто-пролистывание, стрелки и точки
function SimpleSlider({ images = [], intervalMs = 10000, height = 380, radius = 8 }) {
	const [index, setIndex] = useState(0);
	const timerRef = useRef(null);

	useEffect(() => {
		if (!images || images.length <= 1) return; // авто только если есть 2+
		timerRef.current = setInterval(() => {
			setIndex(prev => (prev + 1) % images.length);
		}, intervalMs);
		return () => clearInterval(timerRef.current);
	}, [images, intervalMs]);

	const goTo = (i) => {
		if (!images || images.length === 0) return;
		setIndex((i + images.length) % images.length);
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};

	if (!images || images.length === 0) {
		return (
			<div style={{width: '100%', height, borderRadius: radius, background: '#f3f4f6'}} />
		);
	}

	return (
		<div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: radius }}>
			<div
				style={{
					display: 'flex',
					transform: `translateX(-${index * 100}%)`,
					transition: 'transform 400ms ease',
					width: `${images.length * 100}%`,
					height
				}}
			>
				{images.map((src, i) => (
					<picture key={i} style={{ flex: '0 0 100%' }}>
						<source srcSet={src.webp || ''} type="image/webp" />
						<img
							src={src.jpg || src}
							alt={src.alt || `slide-${i+1}`}
							style={{ width: '100%', height, objectFit: 'cover', display: 'block' }}
							loading={i === 0 ? 'eager' : 'lazy'}
						/>
					</picture>
				))}
			</div>

			{/* Стрелки */}
			{images.length > 1 && (
				<>
					<button
						onClick={() => goTo(index - 1)}
						style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: 999, width: 36, height: 36, cursor: 'pointer' }}
						aria-label="prev"
					>
						‹
					</button>
					<button
						onClick={() => goTo(index + 1)}
						style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: 999, width: 36, height: 36, cursor: 'pointer' }}
						aria-label="next"
					>
						›
					</button>
				</>
			)}

			{/* Точки */}
			{images.length > 1 && (
				<div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
					{images.map((_, i) => (
						<button key={i} onClick={() => goTo(i)} aria-label={`go-to-${i}`} style={{ width: 8, height: 8, borderRadius: 999, border: 'none', background: i === index ? '#FF6B00' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }} />
					))}
				</div>
			)}
		</div>
	);
}

export default SimpleSlider;


