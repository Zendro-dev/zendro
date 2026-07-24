// Tests for the npm-audit remediation: axios -> fetch, download-git-repo -> degit,
// uuid -> crypto.randomUUID, xlsx -> @e965/xlsx.
const { expect } = require("chai");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");
const { clone, axios_post } = require("../../helper");
const XLSX = require("@e965/xlsx");

describe("npm audit fixes", () => {
  describe("axios_post (fetch-based)", () => {
    let server;
    let baseUrl;
    let originalRemoteUrl;

    before((done) => {
      server = http.createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          if (parsed.query === "{fail}") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ errors: [{ message: "boom" }] }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ data: { echoed: parsed.query } }));
        });
      });
      server.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        originalRemoteUrl = process.env.REMOTE_URL;
        process.env.REMOTE_URL = baseUrl;
        done();
      });
    });

    after((done) => {
      process.env.REMOTE_URL = originalRemoteUrl;
      server.close(done);
    });

    it("returns a response shaped like { data: <json body> } on success", async () => {
      const res = await axios_post("{hello}");
      expect(res).to.have.property("data");
      expect(res.data).to.deep.equal({ data: { echoed: "{hello}" } });
    });

    it("throws the parsed error body on a non-2xx response", async () => {
      try {
        await axios_post("{fail}");
        throw new Error("expected axios_post to throw");
      } catch (error) {
        expect(error).to.deep.equal({ errors: [{ message: "boom" }] });
      }
    });
  });

  describe("clone (degit-based)", () => {
    it("downloads and extracts a public GitHub repo into dest", async function () {
      this.timeout(30000);
      const dest = fs.mkdtempSync(path.join(os.tmpdir(), "zendro-degit-"));
      await clone("github:octocat/Hello-World", dest);
      const files = fs.readdirSync(dest);
      expect(files.length).to.be.greaterThan(0);
      fs.rmSync(dest, { recursive: true, force: true });
    });
  });

  describe("@e965/xlsx", () => {
    it("round-trips a workbook through write/read/sheet_to_json", () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ["name", "age"],
        ["alice", "30"],
        ["bob", "25"],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const tmp = path.join(os.tmpdir(), `zendro-xlsx-${randomUUID()}.xlsx`);
      XLSX.writeFile(wb, tmp);

      const workBook = XLSX.readFile(tmp);
      const workSheet = workBook.Sheets[workBook.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(workSheet, { raw: false });

      expect(records).to.deep.equal([
        { name: "alice", age: "30" },
        { name: "bob", age: "25" },
      ]);
      fs.rmSync(tmp);
    });
  });

  describe("crypto.randomUUID", () => {
    it("generates a valid v4 UUID", () => {
      const uuid = randomUUID();
      expect(uuid).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });
});
