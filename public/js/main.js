document.addEventListener('DOMContentLoaded', () => {


    const slider = document.getElementById('slider');
    const container = document.getElementById('inicio');
    let counter = 0;
    let interval;

    if (slider && container) {
        const startCarousel = () => {
            interval = setInterval(() => {
                counter++;
                if (counter >= 3) counter = 0;
                slider.style.transform = `translateX(-${counter * 33.333333}%)`;
            }, 4000);
        };


        container.addEventListener('mouseenter', () => clearInterval(interval));
        container.addEventListener('mouseleave', startCarousel);

        startCarousel();
    }
});