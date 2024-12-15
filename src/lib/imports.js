// const express = require("express");
// const body_parser = require("body-parser");
const is_browser = typeof window !== "undefined";
const is_nodejs = typeof global !== "undefined";
const __current_directory = is_nodejs ? __dirname : "/default";