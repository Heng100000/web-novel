"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "km" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  km: {
    // Navigation
    home: "ទំព័រដើម",
    products: "ផលិតផល",
    discounts: "ការបញ្ចុះតម្លៃ",
    categories: "ប្រភេទផលិតផល",
    search: "ស្វែងរក",

    // UI Elements
    search_placeholder: "ស្វែងរកតាមចំណងជើង, អ្នកនិពន្ធ ឬ ISBN...",
    search_desc: "ស្វែងរកតាមចំណងជើង អ្នកនិពន្ធ ឬប្រភេទ",
    all: "ទាំងអស់",
    all_books: "សៀវភៅទាំងអស់",
    see_more: "មើលបន្ថែម",
    loading: "កំពុងទាញយក...",
    loading_data: "កំពុងទាញយកទិន្នន័យ...",
    no_books_found: "រកមិនឃើញសៀវភៅ",
    try_clearing_filters: "សូមសាកល្បងលុបតម្រងខ្លះ ដើម្បីឃើញលទ្ធផល",
    clear_filters: "សម្អាតតម្រង",
    clear_all_filters: "លុបតម្រងទាំងអស់",
    filter_by_author: "អ្នកនិពន្ធល្បីៗ",
    filter_by_category: "ប្រភេទសៀវភៅ",
    filter_by_status: "ប្រភេទបោះពុម្ព / ស្ថានភាព",
    filter_by_price: "ចន្លោះតម្លៃ ($)",
    min_price_label: "ទាបបំផុត",
    max_price_label: "ខ្ពស់បំផុត",
    filters: "តម្រង",
    filter_title: "តម្រងស្វែងរក",
    filter_desc: "កំណត់តាមតម្រូវការរបស់អ្នក",

    // Statuses
    best_sellers: "លក់ដាច់ជាងគេ",
    new_arrivals: "សៀវភៅមកថ្មី",
    special_edition: "ការបោះពុម្ពពិសេស",
    limited: "ការបោះពុម្ពមានកំណត់",
    reprint: "បោះពុម្ពឡើងវិញ",
    standard: "ការបោះពុម្ពស្តង់ដារ",

    // Cart & User
    cart: "កន្ត្រកទំនិញ",
    wishlist: "បញ្ជីប្រាថ្នា",
    profile: "ព័ត៌មានផ្ទាល់ខ្លួន",
    logout: "ចាកចេញ",
    dashboard: "ផ្ទាំងគ្រប់គ្រង Admin",
    points: "ពិន្ទុ",
    total_points: "ពិន្ទុរង្វាន់សរុប",
    redeem_points: "ប្តូរយករង្វាន់",
    name: "ឈ្មោះ",
    phone: "លេខទូរស័ព្ទ",
    no_phone: "មិនទាន់មាន",
    riel_unit: "៛",

    // Discounts Page
    special_discounts_title: "ការបញ្ចុះតម្លៃពិសេស",
    special_offer_desc: "កម្មវិធីផ្ដល់ជូនពិសេសសម្រាប់អ្នកអាន",
    search_by_author: "ស្វែងរកតាមអ្នកនិពន្ធ",
    matches_found: "ចំណងជើងដែលត្រូវគ្នា",
    author_books_list: "បញ្ជីសៀវភៅរបស់អ្នកនិពន្ធ",
    loading_discounts: "កំពុងទាញយកទិន្នន័យសៀវភៅបញ្ចុះតម្លៃ...",
    show_less: "បង្ហាញតិចវិញ",
    no_discounts_yet: "មិនទាន់មានការបញ្ចុះតម្លៃនៅឡើយទេ",

    // Book Card & Actions
    add_to_cart: "ដាក់ក្នុងកន្ត្រក",
    toast_login_required_fav: "សូមចូលប្រើប្រាស់ជាមុនសិន ដើម្បីរក្សាទុកសៀវភៅដែលចូលចិត្ត",
    toast_fav_added: "បានរក្សាទុកក្នុងបញ្ជីចូលចិត្ត",
    toast_fav_removed: "បានដកចេញពីបញ្ជីចូលចិត្ត",
    toast_error_generic: "មានបញ្ហាក្នុងការរក្សាទុក",
    toast_login_required_cart: "សូមចូលប្រើប្រាស់ជាមុនសិន ដើម្បីដាក់សៀវភៅចូលកន្ត្រក",
    toast_cart_added: "បានដាក់ចូលកន្ត្រកដោយជោគជ័យ",
    toast_error_cart: "មានបញ្ហាក្នុងការដាក់ចូលកន្ត្រក",

    // Footer
    footer_desc: "ជាទីកន្លែងប្រមូលផ្តុំសៀវភៅ និងប្រលោមលោកគ្រប់ប្រភេទ។ យើងប្តេជ្ញាផ្តល់ជូននូវសៀវភៅដែលមានគុណភាព និងបទពិសោធន៍អានដ៏ល្អបំផុតសម្រាប់អ្នកស្រឡាញ់ការអានគ្រប់រូប។",
    others: "ផ្សេងៗ",
    all_products: "ផលិតផលទាំងអស់",
    faq: "សំនួរ និងចម្លើយ",
    about_us: "អំពីពួកយើង",
    blog: "ប្លុក",
    privacy_policy: "គោលការណ៍ភាពឯកជន",
    follow_us: "តាមដានពួកយើង",
    contact_us: "ទាក់ទងមកពួកយើង",
    find_us_on_map: "ស្វែងរកពួកយើងនៅលើផែនទី",
    copyright: "រក្សាសិទ្ធិ",
    by: "ដោយ",
    all_rights_reserved: "រក្សាសិទ្ធិគ្រប់យ៉ាង",
    accept_payment: "ទទួលយកការទូទាត់",
    powered_by: "ដំណើរការដោយ",

    // Search Modal
    search_books_placeholder: "ស្វែងរកសៀវភៅ ឬផលិតផល...",
    popular_products: "ផលិតផលពេញនិយម",
    search_results: "លទ្ធផលស្វែងរក",
    found: "ឃើញ",
    results_unit: "លទ្ធផល",
    try_another_search: "សូមសាកល្បងស្វែងរកពាក្យផ្សេង ឬពិនិត្យអក្ខរាវិរុទ្ធ។",
    searching: "កំពុងស្វែងរក...",
    esc_to_close: "ដើម្បីបិទ",
    enter_to_view: "ដើម្បីមើលផលិតផល",

    // Cart Sidebar
    my_cart: "កន្ត្រកទំនិញរបស់អ្នក",
    empty_cart: "មិនមានទិន្នន័យ",
    checkout: "បញ្ជាទិញ",
    toast_cart_update_error: "មិនអាចកែប្រែចំនួនបានទេ",
    toast_cart_remove_success: "បានលុបចេញពីកន្ត្រក",
    toast_cart_remove_error: "មិនអាចលុបបានទេ",

    // Profile Page
    personal_info: "ព័ត៌មានផ្ទាល់ខ្លួន",
    order_history: "ប្រវត្តិការបញ្ជាទិញ",
    favorite_books: "សៀវភៅដែលចូលចិត្ត",
    cart: "កន្ត្រក",
    reward_points_title: "ពិន្ទុសន្សំ",
    edit_info: "កែសម្រួលព័ត៌មាន",
    edit: "កែប្រែ",
    full_name: "ឈ្មោះពេញ",
    phone_number: "លេខទូរស័ព្ទ",
    email_address: "អាសយដ្ឋាន Email",
    save_changes: "រក្សាទុក",
    cancel: "បោះបង់",
    danger_zone: "តំបន់គ្រោះថ្នាក់",
    delete_account_desc: "ការលុបគណនីនឹងធ្វើឱ្យអ្នកបាត់បង់ទិន្នន័យទាំងអស់ជាអចិន្ត្រៃយ៍។",
    delete_account: "លុបគណនីចោល",
    no_orders_yet: "មិនទាន់មានការបញ្ជាទិញ",
    no_orders_desc: "លោកអ្នកមិនទាន់បានធ្វើការបញ្ជាទិញសៀវភៅណាមួយនៅឡើយទេក្នុងគណនីនេះ។",
    go_to_shop: "ទៅកាន់ហាងសៀវភៅ",
    empty_favorites: "បញ្ជីសៀវភៅចូលចិត្តនៅទទេ",
    empty_favorites_desc: "រក្សាទុកសៀវភៅដែលអ្នកចូលចិត្តនៅទីនេះ ដើម្បីងាយស្រួលរកមើល និងទិញនៅពេលក្រោយ។",
    find_books_now: "ស្វែងរកសៀវភៅឥឡូវនេះ",
    crop_image: "កាត់តរូបភាព",
    done: "រួចរាល់",
    zoom: "ពង្រីក/បង្រួម",
    crop_instructions: "សូមអូសរូបភាពឱ្យចំកណ្តាលរង្វង់ ដើម្បីទទួលបានរូបភាព Profile ស្អាតបំផុត។",
    toast_profile_update_success: "រក្សាទុកជោគជ័យ!",
    toast_profile_update_error: "មានបញ្ហា!",
    toast_image_only: "សូមជ្រើសរើសតែរូបភាពប៉ុណ្ណោះ",
    toast_upload_failed: "ការ Upload បរាជ័យ",
    toast_avatar_success: "ប្តូររូបភាពជោគជ័យ!",
    joined_since: "តាំងពី",
    total_amount: "ទឹកប្រាក់សរុប",
    items_count: "មុខទំនិញ",
    see_more: "មើលបន្ថែម",
    view_details: "មើលលម្អិត",

    // Hero Section
    hero_welcome: "ស្វាគមន៍មកកាន់ពិភពនៃសៀវភៅ",
    hero_title_1: "អានឱ្យកាន់តែច្រើន",
    hero_title_2: "យល់ឱ្យកាន់តែច្បាស់",
    hero_desc: "ស្វែងយល់ពីបណ្តុំសៀវភៅ និងប្រលោមលោកដ៏សម្បូរបែបដែលនឹងផ្លាស់ប្តូរទស្សនវិស័យរបស់អ្នក។ ចាប់ផ្តើមដំណើរការអានដ៏អស្ចារ្យរបស់អ្នកជាមួយយើងនៅថ្ងៃនេះ។",
    meet_authors: "ជួបជាមួយអ្នកនិពន្ធ",
    scroll_down: "អូសចុះក្រោម",

    // Home Banner
    welcome_to: "សូមស្វាគមន៍មកកាន់",
    our_novel_brand: "Our Novel - ហាងលក់សៀវភៅ",
    banner_slogan: "ជម្រាបសួរ! មានអ្វីឱ្យពួកយើងជួយដែរឬទេ?",

    // Chat Widget
    chat_welcome: "សូមស្វាគមន៍!",
    chat_desc: "ជម្រាបសួរ! តើលោកអ្នកត្រូវការជំនួយអ្វីខ្លះក្នុងការជ្រើសរើសសៀវភៅ?",
    chat_now: "ឆាតឥឡូវនេះ",

    // Sections
    on_sale_books: "🏷️ សៀវភៅបញ្ចុះតម្លៃពិសេស",
    best_seller_dynamic: "🔥 លក់ដាច់បំផុត",
    standard_edition: "📚 ការបោះពុម្ពស្តង់ដារ",
    new_arrival_section: "✨ សៀវភៅមកថ្មី",
    special_edition_section: "💎 ការបោះពុម្ពពិសេស",
    limited_edition_section: "⏳ ការបោះពុម្ពមានកំណត់",
    reprint_section: "🔄 បោះពុម្ពឡើងវិញ",

    // Wishlist Page
    wishlist_title: "បញ្ជីប្រាថ្នា",
    wishlist_subtitle: "សៀវភៅទាំងអស់ដែលអ្នកស្រលាញ់ និងចង់អាននៅពេលក្រោយ។",
    wishlist_empty_title: "មិនទាន់មានសៀវភៅក្នុងបញ្ជីនៅឡើយទេ",
    wishlist_empty_desc: "ចាប់ផ្ដើមស្វែងរកសៀវភៅដែលអ្នកចូលចិត្ត ហើយចុចលើរូបបេះដូងដើម្បីរក្សាទុកនៅទីនេះ!",
    wishlist_login_title: "សូមចូលប្រើប្រាស់ជាមុនសិន",
    wishlist_login_desc: "អ្នកត្រូវតែចូលប្រើប្រាស់គណនីរបស់អ្នក ដើម្បីមើលសៀវភៅដែលអ្នកបានរក្សាទុក។",
    wishlist_total_items: "ចំនួនសរុប",
    wishlist_items_unit: "ក្បាល",
    wishlist_personal_tag: "បញ្ជីផ្ទាល់ខ្លួន",
    wishlist_go_shopping: "ទៅមើលសៀវភៅថ្មីៗ",
    wishlist_loading: "កំពុងរៀបចំបញ្ជីប្រាថ្នារបស់អ្នក...",
    wishlist_fetch_error: "មិនអាចទាញយកបញ្ជីប្រាថ្នាបានទេ",
    wishlist_login_now: "ចូលប្រើប្រាស់ឥឡូវនេះ",

    // Checkout Page
    checkout_review: "ពិនិត្យមុនពេលចេញ",
    checkout_phone: "លេខទូរស័ព្ទ",
    checkout_phone_placeholder: "សូមបញ្ចូលលេខទូរស័ព្ទសម្រាប់ទាក់ទង...",
    checkout_address: "អាសយដ្ឋានដឹកជញ្ជូន",
    checkout_address_placeholder: "សូមបញ្ចូលអាសយដ្ឋានលម្អិត...",
    checkout_shipping: "ជ្រើសរើសការដឹកជញ្ជូន",
    checkout_notes: "ចំណាំសម្រាប់ការដឹកជញ្ជូន",
    checkout_notes_placeholder: "Ex: នៅផ្ទះលេខB, etc.",
    checkout_summary: "សង្ខេបការបញ្ជាទិញ",
    checkout_product_price: "តម្លៃផលិតផល",
    checkout_shipping_fee: "សេវាដឹកជញ្ជូន",
    checkout_total: "តម្លៃសរុបទាំងអស់",
    checkout_payment_method: "សូមជ្រើសរើសវិធីបង់លុយ",
    checkout_aba_qr: "ABA KHQR",
    checkout_aba_desc: "ស្កេនដើម្បីទូទាត់ជាមួយកម្មវិធីធនាគារ",
    checkout_pay_on_pickup: "បង់លុយពេលមកយកផ្ទាល់",
    checkout_pay_on_pickup_desc: "បង់ប្រាក់នៅហាងផ្ទាល់ពេលមកទទួលសៀវភៅ",
    checkout_confirm_order: "យល់ព្រមបញ្ជាទិញ",
    checkout_aba_scan_title: "ស្កេនដើម្បីបង់ប្រាក់តាម ABA",
    checkout_aba_open_app: "បើកកម្មវិធី ABA (Pay with ABA Mobile)",
    checkout_aba_instructions: "* សូមថតរូបភាព QR នេះ ឬបើកកម្មវិធី ABA ដើម្បីបង់ប្រាក់",
    checkout_success: "ការបញ្ជាទិញទទួលបានជោគជ័យ!",
    checkout_error: "ការបញ្ជាទិញមិនបានសម្រេច",
    checkout_empty_cart: "កន្ត្រកទំនិញរបស់អ្នកគឺទទេ",
    checkout_otp_title: "បញ្ជាក់លេខកូដ OTP",
    checkout_otp_desc: "លេខកូដបញ្ជាក់ ៦ ខ្ទង់ ត្រូវបានផ្ញើទៅកាន់លេខ",
    checkout_otp_verify: "បញ្ជាក់លេខកូដ",
    checkout_otp_resend: "មិនទទួលបានលេខកូដ? ផ្ញើឡើងវិញ",
    checkout_quantity: "ចំនួន",

    // Flash Sale
    happening_now: "កំពុងបន្តផ្ទាល់",
    ends_in: "បញ្ចប់ក្នុងរយៈពេល",
    hours_label: "ម៉ោង",
    minutes_label: "នាទី",
    seconds_label: "វិនាទី",
    top_flash_deals: "ទំនិញ Flash Sale ពិសេស",
    items_unit: "មុខ",
    sold: "លក់ដាច់",
    left: "នៅសល់",
    dont_miss_out_title: "មិនទាន់មានការបញ្ចុះតម្លៃថ្មីៗ!",
    flash_sale_empty_desc: "សូមរង់ចាំបន្តិច! យើងនឹងនាំមកជូននូវការបញ្ចុះតម្លៃដ៏អស្ចារ្យក្នុងពេលឆាប់ៗនេះ។ កុំឱ្យរំលងឱកាសក្រោយ!",
    flash_sale: "Flash Sale",
  },
  en: {
    // Navigation
    home: "Home",
    products: "Products",
    discounts: "Discounts",
    categories: "Categories",
    search: "Search",

    // UI Elements
    search_placeholder: "Search by title, author or ISBN...",
    search_desc: "Search by title, author or category",
    all: "All",
    all_books: "All Books",
    see_more: "See More",
    loading: "Loading...",
    loading_data: "Loading data...",
    no_books_found: "No books found",
    try_clearing_filters: "Please try clearing some filters to see results",
    clear_filters: "Clear Filters",
    clear_all_filters: "Clear All Filters",
    filter_by_author: "Top Authors",
    filter_by_category: "Book Categories",
    filter_by_status: "Edition Type / Status",
    filter_by_price: "Price Range ($)",
    min_price_label: "Min Price",
    max_price_label: "Max Price",
    filters: "Filters",
    filter_title: "Search Filters",
    filter_desc: "Customize your search",

    // Statuses
    best_sellers: "Best Seller",
    new_arrivals: "New Arrival",
    special_edition: "Special Edition",
    limited: "Limited Edition",
    reprint: "Reprint",
    standard: "Standard Edition",

    // Cart & User
    cart: "Shopping Cart",
    wishlist: "Wishlist",
    profile: "Profile",
    logout: "Logout",
    dashboard: "Admin Dashboard",
    points: "Points",
    total_points: "Total Reward Points",
    redeem_points: "Redeem Rewards",
    name: "Name",
    phone: "Phone",
    no_phone: "None",
    riel_unit: "៛",

    // Discounts Page
    special_discounts_title: "Special Discounts",
    special_offer_desc: "Special program for readers",
    search_by_author: "Search by Author",
    matches_found: "matching titles found",
    author_books_list: "Author's Book List",
    loading_discounts: "Loading discounted books...",
    show_less: "Show Less",
    no_discounts_yet: "No discounts available at the moment",

    // Book Card & Actions
    add_to_cart: "Add to Cart",
    toast_login_required_fav: "Please login first to save favorites",
    toast_fav_added: "Saved to wishlist",
    toast_fav_removed: "Removed from wishlist",
    toast_error_generic: "Something went wrong",
    toast_login_required_cart: "Please login first to add to cart",
    toast_cart_added: "Added to cart successfully",
    toast_error_cart: "Failed to add to cart",

    // Footer
    footer_desc: "is a collection of all kinds of books and novels. We are committed to providing quality books and the best reading experience for every reading lover.",
    others: "Others",
    all_products: "All Products",
    faq: "FAQ",
    about_us: "About Us",
    blog: "Blog",
    privacy_policy: "Privacy Policy",
    follow_us: "Follow Us",
    contact_us: "Contact Us",
    find_us_on_map: "Find us on map",
    copyright: "Copyright",
    by: "by",
    all_rights_reserved: "All rights reserved",
    accept_payment: "Accept Payment",
    powered_by: "Powered by",

    // Search Modal
    search_books_placeholder: "Search books or products...",
    popular_products: "Popular Products",
    search_results: "Search Results",
    found: "Found",
    results_unit: "results",
    try_another_search: "Try searching for something else or check spelling.",
    searching: "Searching...",
    esc_to_close: "to close",
    enter_to_view: "to view product",

    // Cart Sidebar
    my_cart: "Your Shopping Cart",
    empty_cart: "Cart is empty",
    checkout: "Checkout",
    toast_cart_update_error: "Failed to update quantity",
    toast_cart_remove_success: "Removed from cart",
    toast_cart_remove_error: "Failed to remove item",

    // Profile Page
    personal_info: "Personal Information",
    order_history: "Order History",
    favorite_books: "Favorite Books",
    cart: "Cart",
    reward_points_title: "Reward Points",
    edit_info: "Edit Information",
    edit: "Edit",
    full_name: "Full Name",
    phone_number: "Phone Number",
    email_address: "Email Address",
    save_changes: "Save Changes",
    cancel: "Cancel",
    danger_zone: "Danger Zone",
    delete_account_desc: "Deleting your account will permanently lose all your data.",
    delete_account: "Delete Account",
    no_orders_yet: "No orders yet",
    no_orders_desc: "You haven't made any book orders in this account yet.",
    go_to_shop: "Go to Shop",
    empty_favorites: "Wishlist is empty",
    empty_favorites_desc: "Save your favorite books here to easily find and buy them later.",
    find_books_now: "Find Books Now",
    crop_image: "Crop Image",
    done: "Done",
    zoom: "Zoom",
    crop_instructions: "Please drag the image to the center of the circle for the best profile picture.",
    toast_profile_update_success: "Updated successfully!",
    toast_profile_update_error: "Update failed!",
    toast_image_only: "Please select images only",
    toast_upload_failed: "Upload failed",
    toast_avatar_success: "Avatar updated successfully!",
    joined_since: "Since",
    total_amount: "Total Amount",
    items_count: "Items",
    see_more: "See More",
    view_details: "View Details",

    // Hero Section
    hero_welcome: "Welcome to the world of books",
    hero_title_1: "Read More",
    hero_title_2: "Understand Better",
    hero_desc: "Discover a rich collection of books and novels that will change your perspective. Start your wonderful reading journey with us today.",
    meet_authors: "Meet the Authors",
    scroll_down: "Scroll Down",

    // Home Banner
    welcome_to: "Welcome to",
    our_novel_brand: "Our Novel - ហាងលក់សៀវភៅ",
    banner_slogan: "Hello! Is there anything we can help you with?",

    // Chat Widget
    chat_welcome: "Welcome!",
    chat_desc: "Hello! Do you need any help in choosing books?",
    chat_now: "Chat now",

    // Sections
    on_sale_books: "🏷️ Special Discounted Books",
    best_seller_dynamic: "🔥 Best Sellers",
    standard_edition: "📚 Standard Editions",
    new_arrival_section: "✨ New Arrivals",
    special_edition_section: "💎 Special Editions",
    limited_edition_section: "⏳ Limited Editions",
    reprint_section: "🔄 Reprints",

    // Wishlist Page
    wishlist_title: "My Wishlist",
    wishlist_subtitle: "All the books you love and want to read later.",
    wishlist_empty_title: "Your wishlist is empty",
    wishlist_empty_desc: "Start exploring books you like and click the heart icon to save them here!",
    wishlist_login_title: "Please Login First",
    wishlist_login_desc: "You need to log in to your account to view your saved books.",
    wishlist_total_items: "Total Items",
    wishlist_items_unit: "books",
    wishlist_personal_tag: "Personal List",
    wishlist_go_shopping: "Explore New Books",
    wishlist_loading: "Preparing your wishlist...",
    wishlist_fetch_error: "Failed to fetch wishlist",
    wishlist_login_now: "Login Now",

    // Checkout Page
    checkout_review: "Review Order",
    checkout_phone: "Phone Number",
    checkout_phone_placeholder: "Enter contact phone number...",
    checkout_address: "Shipping Address",
    checkout_address_placeholder: "Enter detailed address...",
    checkout_shipping: "Select Shipping Method",
    checkout_notes: "Shipping Notes",
    checkout_notes_placeholder: "Ex: Near Block B, etc.",
    checkout_summary: "Order Summary",
    checkout_product_price: "Product Price",
    checkout_shipping_fee: "Shipping Fee",
    checkout_total: "Grand Total",
    checkout_payment_method: "Select Payment Method",
    checkout_aba_qr: "ABA KHQR",
    checkout_aba_desc: "Scan to pay with banking app",
    checkout_pay_on_pickup: "Pay on Pickup",
    checkout_pay_on_pickup_desc: "Pay at the store when you pick up",
    checkout_confirm_order: "Confirm Order",
    checkout_aba_scan_title: "Scan to pay via ABA",
    checkout_aba_open_app: "Open ABA App (Pay with ABA Mobile)",
    checkout_aba_instructions: "* Please take a screenshot of this QR or open ABA app to pay",
    checkout_success: "Order placed successfully!",
    checkout_error: "Failed to place order",
    checkout_empty_cart: "Your cart is empty",
    checkout_otp_title: "Verify OTP",
    checkout_otp_desc: "A 6-digit verification code has been sent to",
    checkout_otp_verify: "Verify Code",
    checkout_otp_resend: "Didn't receive code? Resend",
    checkout_quantity: "Quantity",

    // Flash Sale
    happening_now: "Happening Now",
    ends_in: "Ends In",
    hours_label: "Hrs",
    minutes_label: "Min",
    seconds_label: "Sec",
    top_flash_deals: "Top Flash Deals",
    items_unit: "items",
    sold: "Sold",
    left: "Left",
    dont_miss_out_title: "No Flash Sales at the Moment!",
    flash_sale_empty_desc: "Please wait a bit! We will bring more amazing deals soon. Don't miss out next time!",
    flash_sale: "Flash Sale",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("km");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved) setLanguage(saved);
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string) => {
    if (!mounted) return key; // Return key or KM default during SSR/hydration
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}
