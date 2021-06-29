// Allow Jest to access global variables
import $ from "jquery";
// import "jquery-ui-bundle"; // Doesn't work, must be included in tests that need it
global.$ = global.jQuery = $;
