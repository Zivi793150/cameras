import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import { trackButtonClick } from '../utils/analytics';
import '../styles/Product.css';
import Seo from '../components/Seo';

const Cooperation = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenModal = () => {
		trackButtonClick('Оставить заявку', 'cooperation_page');
		setIsModalOpen(true);
	};

	const handleCloseModal = () => setIsModalOpen(false);

	return (
  <div className="cooperation">
    <Seo
      title="Сотрудничество — опт и компании | Eltok.kz"
      description="Сотрудничество для оптовиков и компаний: прайс-лист, условия закупок и заявка на партнёрство на Eltok.kz."
      canonical="https://eltok.kz/cooperation"
    />
    <Header />
			<main className="product-main" style={{ background: '#fff' }}>
				<section className="main-maket-section" style={{ padding: '40px 0' }}>
					<div className="main-maket-container">
            <div className="main-maket-right" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              {/* Текст слева */}
              <div>
                <h1 className="main-maket-title">Сотрудничество для оптовиков и компаний</h1>
                <div className="main-maket-subtitle" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>
                  Eltok.kz сотрудничает с оптовыми компаниями, снабженцами, строительными организациями,
                  интернет-магазинами и дистрибьюторами.
              </div>
                <div style={{ fontSize: '1rem', lineHeight: 1.65, color: '#333', marginBottom: 12 }}>
                  Мы обеспечиваем прямые поставки без посредников, гибкие условия закупок от мелкого
                  до крупного опта, персональное сопровождение менеджера и сервисную поддержку. Для
                  партнёров действуют акции и розыгрыши, а поставки выполняются не только по Казахстану,
                  но и в страны СНГ.
                </div>
                <div style={{ fontSize: '1rem', lineHeight: 1.65, color: '#333', marginBottom: 18 }}>
                  Свяжитесь с нами и получите персональное предложение. Скачайте прайс-лист или оставьте
                  заявку для сотрудничества.
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
								<a
									href={encodeURI('/price/tanker-price.pdf')}
									download="Прайс-лист Танкер.pdf"
									className="main-maket-btn"
									style={{ background: '#2d3748', width: 220, textAlign: 'center', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}
									onClick={() => trackButtonClick('Скачать прайс-лист', 'cooperation_page')}
								>
                    Скачайте прайс-лист
								</a>
                  <button className="main-maket-btn" onClick={handleOpenModal} style={{ width: 220, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    Оставить заявку
                  </button>
							</div>
              </div>
              {/* Фото справа */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={encodeURI('/images/договор.webp')} alt="Сотрудничество, договор" style={{ width: '100%', maxWidth: 520, height: 'auto', borderRadius: 6, objectFit: 'cover' }} loading="lazy" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=encodeURI('/images/договор.webp'); }} />
              </div>

        </div>
      </div>
				</section>
        <style>{`
          @media (max-width: 900px) {
            .cooperation .main-maket-right { grid-template-columns: 1fr !important; }
            .cooperation .main-maket-right > div:last-child { display: none !important; }
          }
        `}</style>
    </main>
    <Footer />
			<Modal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={() => {}} />
  </div>
);
};

export default Cooperation; 