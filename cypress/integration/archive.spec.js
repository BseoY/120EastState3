describe("Archive page", () => {
    it("loads and lists posts", () => {
      cy.visit("http://localhost:3000/archive");
      cy.get(".post-card").should("have.length.at.least", 1);
    });
  });