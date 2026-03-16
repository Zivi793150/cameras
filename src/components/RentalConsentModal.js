import React, { useState } from 'react';
import '../styles/Modal.css';

const RentalConsentModal = ({ isOpen, onClose, onAccept }) => {
  const [showTerms, setShowTerms] = useState(false);

  if (!isOpen) return null;

  const rentalTerms = `УСЛОВИЯ АРЕНДЫ ЭЛЕКТРОИНСТРУМЕНТОВ

1. Общие положения
Аренда предоставляется на срок от 1 суток.
Для оформления аренды требуется документ, удостоверяющий личность (удостоверение личности или водительское).
Перед выдачей инструмента вносится залог, равный стоимости инструмента — он возвращается после проверки и возврата инструмента в исправном состоянии.

Арендная плата и срок аренды согласовываются заранее, чтобы избежать недопонимания. Обе стороны должны быть согласны на условия добровольно и без обмана так, как требует ислам (справедливость и прозрачность в сделке).

2. Ответственность арендатора
Арендатор несёт полную ответственность за сохранность и правильное использование инструмента в течение всего срока аренды.
Инструмент используется только по назначению и в обычных условиях эксплуатации.
Передача инструмента третьим лицам без согласия арендодателя запрещена.
В случае утраты, кражи, порчи или выхода из строя по вине арендатора ущерб возмещается в полном объёме, включая стоимость ремонта или замены.

3. Возврат инструмента
Инструмент возвращается в чистом и рабочем состоянии, с полным комплектом принадлежностей.
Если возврат задержан, взимается штраф 50 % от суточной аренды за каждый день просрочки.
После проверки инструмента арендодатель возвращает залог полностью либо удерживает часть, если выявлены повреждения или недостача.
Если инструмент неисправен не по вине арендатора — ответственность не наступает, но он обязан сообщить об этом сразу после обнаружения.

4. Оплата и справедливость
Арендная плата устанавливается по взаимному согласию сторон.
Цена должна быть честной и прозрачной, без скрытых доплат или комиссий.
Арендодатель не имеет права завышать плату без основания, а арендатор обязан вернуть инструмент вовремя и в сохранности — чтобы сделка оставалась чистой и справедливой по шариату.

5. Прочие условия
Любые споры решаются мирно и по справедливости — сначала путём переговоров, а при необходимости — в соответствии с законодательством Республики Казахстан.
Аренда — это доверие и ответственность обеих сторон, поэтому важно относиться к инструменту бережно и выполнять условия договора.`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: showTerms ? '600px' : '500px' }}>
        <div className="modal-header">
          <h3>{showTerms ? 'Условия аренды' : 'Подтверждение аренды'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" style={{padding: '20px', textAlign: showTerms ? 'left' : 'center'}}>
          {!showTerms ? (
            <>
              <p style={{fontSize: '1.1rem', color: '#222', marginBottom: '20px', lineHeight: '1.6'}}>
                Если вы берете в аренду, соглашаетесь с{' '}
                <span 
                  onClick={() => setShowTerms(true)}
                  style={{
                    color: '#1e88e5',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  условиями пользования
                </span>
              </p>
              <button 
                onClick={onAccept}
                className="btn-submit"
                style={{
                  background: '#FF6B00',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 40px',
                  fontSize: '1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Ознакомлен
              </button>
            </>
          ) : (
            <>
              <div style={{
                fontSize: '0.95rem',
                color: '#333',
                lineHeight: '1.8',
                whiteSpace: 'pre-line',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '10px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                {rentalTerms}
              </div>
              <button 
                onClick={() => setShowTerms(false)}
                className="btn-submit"
                style={{
                  background: '#1e88e5',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 40px',
                  fontSize: '1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  width: '100%'
                }}
              >
                Ознакомлен
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalConsentModal;
