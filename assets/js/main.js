(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var toggle = document.querySelector('.nav-toggle');
        var nav = document.querySelector('.main-nav');
        if (toggle && nav) {
            toggle.addEventListener('click', function () {
                nav.classList.toggle('open');
                var expanded = nav.classList.contains('open');
                toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            });
        }

        var path = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.main-nav a').forEach(function (link) {
            var href = link.getAttribute('href');
            if (href === path) {
                link.classList.add('active');
            } else if (href !== 'index.html') {
                link.classList.remove('active');
            }
        });
    });
})();
