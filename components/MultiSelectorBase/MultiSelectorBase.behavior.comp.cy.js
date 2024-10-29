import MultiSelectorBase from '@comps/MultiSelectorBase/MultiSelectorBase.vue';

describe('Test the MultiSelectorBase component behavior', () => {
  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.restoreSessionStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
    cy.saveSessionStorage();
  });

  it('Check selected prop is reactive', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        selected: ['one'],
        options: ['one', 'two', 'three', 'four', 'five'],
      },
    }).then(({ wrapper }) => {
      cy.get('@readySpy')
        .should('have.been.calledOnce')
        .then(() => {
          cy.get('[data-cy="selector-1"]')
            .find('[data-cy="selector-input"]')
            .should('have.value', 'one');
        })
        .then(() => {
          /*
           * Without extra then here, the wrapper.setProps usually executes before
           * the cy.get() above, causing the test to fail.
           */
          wrapper.setProps({ selected: ['one', 'two'] });
          cy.get('[data-cy="selector-1"]')
            .find('[data-cy="selector-input"]')
            .should('have.value', 'one');
          cy.get('[data-cy="selector-2"]')
            .find('[data-cy="selector-input"]')
            .should('have.value', 'two');
        });
    });
  });

  it('Making selections adds another selector', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        options: ['one', 'two', 'three', 'four', 'five'],
        popupUrl: 'nonEmptyUrl',
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('[data-cy="selector-2"]').should('not.exist');
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-add-button"]')
          .should('exist');
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-delete-button"]')
          .should('not.exist');

        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .select('one');

        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-add-button"]')
          .should('not.exist');
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-delete-button"]')
          .should('exist');

        cy.get('[data-cy="selector-2"]').should('exist');
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-add-button"]')
          .should('exist');
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-delete-button"]')
          .should('not.exist');
      });
  });

  it('Delete button can remove first selection', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        selected: ['one', 'two', 'three'],
        options: ['one', 'two', 'three', 'four', 'five'],
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'one');
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'two');
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'three');
        cy.get('[data-cy="selector-4"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', null);

        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'two');
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'three');
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', null);
        cy.get('[data-cy="selector-4"]').should('not.exist');
      });
  });

  it('Delete button can remove last selection', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        selected: ['one', 'two', 'three'],
        options: ['one', 'two', 'three', 'four', 'five'],
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'one');
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'two');
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', null);
        cy.get('[data-cy="selector-4"]').should('not.exist');
      });
  });

  it('Delete button can remove a middle selection', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        selected: ['one', 'two', 'three'],
        options: ['one', 'two', 'three', 'four', 'five'],
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'one');
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'three');
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', null);
        cy.get('[data-cy="selector-4"]').should('not.exist');
      });
  });

  it('Selecting an option removes it from available options in subsequent selectors', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        options: ['one', 'two', 'three', 'four', 'five'],
        noRepeat: true,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // Select "one" in the first selector
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .select('one');

        // Verify that "one" is not available in the second selector
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .children('option')
          .should('not.contain', 'one');
      });
  });

  it('Removing a selected option restores it to available options in subsequent selectors', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        selected: ['one', 'two'],
        options: ['one', 'two', 'three', 'four', 'five'],
        noRepeat: true,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // Verify initial selections
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'one');
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .should('have.value', 'two');

        // Delete the first selection
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        // Verify that "one" is now available in the second selector
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .children('option')
          .should('contain', 'one');
      });
  });

  it('Selecting multiple options reduces available options incrementally', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        options: ['one', 'two', 'three', 'four', 'five'],
        noRepeat: true,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // Select "one" in the first selector
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .select('one');

        // Select "two" in the second selector
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .select('two');

        // Verify that "one" and "two" are not available in the third selector
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .children('option')
          .should('not.contain', 'one')
          .and('not.contain', 'two');
      });
  });

  it('Deleting a middle selection restores it in subsequent selectors', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        selected: ['one', 'two', 'three'],
        options: ['one', 'two', 'three', 'four', 'five'],
        noRepeat: true,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // Delete the middle selection ("two")
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        // Verify that "two" is now available in the third selector
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .children('option')
          .should('contain', 'two');
      });
  });

  it('Adding a new selection removes it from subsequent selectors when noRepeat is true', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        selected: [],
        options: ['one', 'two', 'three', 'four', 'five'],
        noRepeat: true, // Enable noRepeat
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // Initially select "one" in the first selector
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .select('one');

        // Verify that "one" is not available in the second selector
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .children('option')
          .should('not.contain', 'one');

        // Select "two" in the second selector
        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .select('two');

        // Verify that "one" and "two" are not available in the third selector
        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .children('option')
          .should('not.contain', 'one')
          .and('not.contain', 'two');
      });
  });

  it('Selecting all options until none are left, then removing all to restore full options list', () => {
    const readySpy = cy.spy().as('readySpy');

    cy.mount(MultiSelectorBase, {
      props: {
        onReady: readySpy,
        options: ['one', 'two', 'three', 'four', 'five'],
        noRepeat: true,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // Select all options one by one until no options are left
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .select('one');

        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-input"]')
          .select('two');

        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-input"]')
          .select('three');

        cy.get('[data-cy="selector-4"]')
          .find('[data-cy="selector-input"]')
          .select('four');

        cy.get('[data-cy="selector-5"]')
          .find('[data-cy="selector-input"]')
          .select('five');

        // Verify no new selector is added because all options are selected
        cy.get('[data-cy="selector-6"]').should('not.exist');

        // Remove all selections one by one
        cy.get('[data-cy="selector-5"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        cy.get('[data-cy="selector-4"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        cy.get('[data-cy="selector-3"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        cy.get('[data-cy="selector-2"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-delete-button"]')
          .click();

        // Verify that all options are restored and available in the first selector
        cy.get('[data-cy="selector-1"]')
          .find('[data-cy="selector-input"]')
          .children('option')
          .should('contain', 'one')
          .and('contain', 'two')
          .and('contain', 'three')
          .and('contain', 'four')
          .and('contain', 'five');
      });
  });
});
