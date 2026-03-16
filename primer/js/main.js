/* 
 * Main JavaScript for Security Landing Page 
 * Author: Antigravity
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.innerHTML = navMenu.classList.contains('active')
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-bars"></i>';
        });
    }

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            if (navMenu) navMenu.classList.remove('active');
            if (hamburger) hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Quiz Logic (Removed - Replaced with new implementation in index.html)

    // Accordion (FAQ)
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');

            // Close all others
            document.querySelectorAll('.accordion-item').forEach(i => {
                i.classList.remove('active');
            });

            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Modal Handling (Updated for Tailwind)
    const modal = document.getElementById('modal-request');
    const modalBtns = document.querySelectorAll('.open-modal');

    // Global function for inline onclick handlers
    window.toggleModal = function (show) {
        if (!modal) return;

        if (show) {
            modal.classList.remove('hidden');
            // Trigger reflow
            void modal.offsetWidth;
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
            modal.querySelector('div').classList.add('scale-100');
        } else {
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.remove('scale-100');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    };

    if (modal) {
        modalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleModal(true);
            });
        });
    }

    window.submitModalForm = async function () {
        const form = modal.querySelector('form');
        const name = form.querySelector('input[type="text"]')?.value?.trim() || '';
        const phone = form.querySelector('input[type="tel"]')?.value?.trim() || '';

        const digits = (phone || '').replace(/\D/g, '');
        if (!digits || digits.length < 11 || !digits.startsWith('77')) {
            alert('Пожалуйста, введите корректный номер телефона в формате +7 7XX XXX XX XX');
            return;
        }

        const msg = `<b>📞 Заявка на звонок</b>\n\n`
            + `<b>Имя:</b> ${name || 'Не указано'}\n`
            + `<b>Телефон:</b> ${phone}`;

        if (typeof sendToTelegram === 'function') {
            await sendToTelegram(msg);
        }

        if (typeof ym === 'function') ym(window.YM_ID, 'reachGoal', 'callback_submit');
        if (typeof gtag === 'function') gtag('event', 'callback_submit', { event_category: 'forms' });

        // Обновляем URL для отдельной конверсии по заявке на звонок
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('callback_success', '1');
            window.history.pushState({}, '', url.toString());
        } catch (e) {
            console.warn('Could not update URL for callback conversion', e);
        }

        toggleModal(false);

        const successMsg = document.getElementById('success-message');
        if (successMsg) {
            successMsg.classList.remove('hidden');
            setTimeout(() => { form.reset(); }, 300);
        } else {
            alert('Спасибо! Ваша заявка принята.');
            form.reset();
        }
    };
});
