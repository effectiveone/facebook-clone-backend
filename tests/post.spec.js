const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const Post = require("../models/Post");

chai.use(chaiHttp);
const expect = chai.expect;

describe("createPost", () => {
  beforeEach(async () => {
    await Post.deleteMany({});
  });

  it("should create a post", async () => {
    const postData = {
      content: "Test post",
      user: "123",
    };

    const res = await chai.request(app).post("/api/posts").send(postData);

    expect(res).to.have.status(200);
    expect(res.body).to.be.an("object");
    expect(res.body.content).to.equal(postData.content);
    expect(res.body.user).to.equal(postData.user);
  });

  it("should return an error for missing content", async () => {
    const postData = {
      user: "123",
    };

    const res = await chai.request(app).post("/api/posts").send(postData);

    expect(res).to.have.status(500);
    expect(res.body).to.be.an("object");
    expect(res.body.message).to.equal(
      "Post validation failed: content: Path `content` is required."
    );
  });

  it("should return an error for missing user", async () => {
    const postData = {
      content: "Test post",
    };

    const res = await chai.request(app).post("/api/posts").send(postData);

    expect(res).to.have.status(500);
    expect(res.body).to.be.an("object");
    expect(res.body.message).to.equal(
      "Post validation failed: user: Path `user` is required."
    );
  });
});
