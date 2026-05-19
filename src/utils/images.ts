import alert from "../assets/icons/alert.svg";
import bell from "../assets/icons/bell.svg";
import bills from "../assets/icons/bills.svg";
import budget from "../assets/icons/budget.svg";
import card from "../assets/icons/card.svg";
import check from "../assets/icons/check.svg";
import empty_check from "../assets/icons/empty_check.svg";
import gears from "../assets/icons/gears.svg";
import home from "../assets/icons/home.svg";
import menu from "../assets/icons/hamburger.png";
import plane from "../assets/icons/plane.svg";
import plus from "../assets/icons/plus.svg";
import report from "../assets/icons/report.svg";
import search from "../assets/icons/search.svg";
import searchLight from "../assets/icons/search.png";
import user from "../assets/icons/user.svg";
import wallet from "../assets/icons/wallet.svg";
import wealth from "../assets/icons/wealth.svg";
import login from "../assets/icons/login.svg";
import edit from "../assets/icons/edit.png";
import remove from "../assets/icons/delete.png";
import access from "../assets/icons/access-control.png";
import person_one from "../assets/images/person_one.jpg";
import brand_one from "../assets/images/Optimark1.png";
import brand_two from "../assets/images/Optimark_main.png";
import home_main from "../assets/images/homepage.svg";
import grid from "../assets/icons/grid.png";
import list from "../assets/icons/list.png";
import arrow from "../assets/icons/right-arrow.png";
import back_btn from "../assets/icons/back-button.png";
import batchimport from "../assets/icons/file-importpng.png";
import group from "../assets/icons/group.png";
import epople from "../assets/icons/user.png";
import registries from "../assets/icons/registries.png";
import community from "../assets/icons/communities.png";
import collection from "../assets/icons/collection.png";
import collectionname from "../assets/icons/collectionname.png";
import add from "../assets/icons/Add.png";
import cancel from "../assets/icons/cancel.png";
import save from "../assets/icons/save.png";
import minus from "../assets/icons/minus.png";
import whiteEditIcon from "../assets/icons/white_edit_icon.png";
import group_icon_black from "../assets/icons/group_icon_black.png";
import preview from "../assets/images/about1.webp";
import person from "../assets/images/person.png";
import business_person from "../assets/images/business_person.png";
import aboutBack from "../assets/images/aboutBack.jpg";
import slide1 from "../assets/images/slider1.jpg";
import slide2 from "../assets/images/slider2.jpg";
import slide3 from "../assets/images/slider3.jpg";



interface IconsImages {
    alert: string;
    bell: string;
    bills: string;
    budget: string;
    card: string;
    check: string;
    empty_check: string;
    gears: string;
    home: string;
    menu: string;
    plane: string;
    plus: string;
    report: string;
    search: string;
    user: string;
    wallet: string;
    wealth: string;
    login: string;
    edit: string;
    remove: string;
    access: string;
    list: string;
    grid: string;
    arrow: string;
    back_btn: string;
    searchLight: string;
    batchimport: string;
    group: string;
    epople: string;
    registries: string;
    collection: string;
    community: string;
    collectionname: string;
    add: string;
    cancel:string;
    save: string;
    minus:string;
    whiteEditIcon: string;
    group_icon_black:string;
    aboutBack: string
}


interface PersonsImages {
    person_one: string;
    brand_one: string;
    brand_two: string;
    home_main: string;
}
interface About_US{
    preview: string;
    person: string;
    business_person: string;
}
export const ImageSlider: string[] = [
  slide1,
  slide2,
  slide3
];
// Export typed objects
export const iconsImgs: IconsImages = {
    alert, bell, bills, budget, card, check, empty_check, gears, home, menu, plane, plus, report, search, searchLight, user, wallet, wealth, login, edit, remove, access, list, grid, arrow, back_btn, batchimport, group, epople, registries, collection, community , collectionname, save, cancel, add ,minus,whiteEditIcon,group_icon_black,aboutBack
};

export const personsImgs: PersonsImages = {
    person_one, brand_one, brand_two, home_main
};

export const about_us: About_US = {
    preview, person, business_person
};