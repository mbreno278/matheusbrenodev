
const btn_menu_primary = document.querySelector(".btn-menu-primary-mb");
btn_menu_primary.addEventListener("click", function() {
    const menu_content = document.querySelector(".menu-primary-mb > ul");

    const display = getComputedStyle(menu_content).display;

    if (display == "none") {
        menu_content.classList.add("actived");
    }else {
        menu_content.classList.remove("actived");
    }

});