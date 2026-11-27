// node controllers/blogVisit.check.js — a browser is counted once per post
const assert = require("assert");
const Blog = require("../models/Blog");
const BlogVisitor = require("../models/BlogVisitor");
const { recordBlogVisit } = require("./blogController");

const id = "507f1f77bcf86cd799439011";
const seen = new Set();
let count = 0;
Blog.exists = async () => ({ _id: id });
BlogVisitor.create = async ({ visitor }) => {
  if (seen.has(visitor)) throw Object.assign(new Error("dup"), { code: 11000 });
  seen.add(visitor);
};
Blog.findByIdAndUpdate = async () => ({ uniqueVisitors: ++count });
Blog.findById = () => ({ select: async () => ({ uniqueVisitors: count }) });

const call = async (visitor, blogId = id) => {
  let out;
  const res = { status: (c) => ((out = { code: c }), res), json: (b) => ((out = { code: 200, ...out, ...b }), res) };
  await recordBlogVisit({ params: { id: blogId }, body: { visitor } }, res);
  return out;
};

(async () => {
  assert.equal((await call("aaaaaaaa-1")).uniqueVisitors, 1);
  assert.equal((await call("aaaaaaaa-1")).counted, false); // repeat visit
  assert.equal((await call("aaaaaaaa-1")).uniqueVisitors, 1);
  assert.equal((await call("bbbbbbbb-2")).uniqueVisitors, 2);
  assert.equal((await call("bad id!")).code, 400);
  assert.equal((await call("aaaaaaaa-1", "nope")).code, 400);
  console.log("blog visit check ok");
})();
