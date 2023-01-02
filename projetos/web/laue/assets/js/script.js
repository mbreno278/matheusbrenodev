
const menu_btn_primary = document.querySelector(".btn-menu-primary");

menu_btn_primary.addEventListener("click", function() {
    const menu_content = document.querySelector(".menu-primary ul");

    if (menu_btn_primary.classList.contains("actived")) {
        menu_btn_primary.classList.remove("actived");
        menu_content.classList.remove("actived");
    }else {
        menu_btn_primary.classList.add("actived");
        menu_content.classList.add("actived");
    }

});