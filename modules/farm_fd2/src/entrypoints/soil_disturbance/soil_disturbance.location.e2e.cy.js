describe('Soil Disturbance: Location Component', () => {
  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.restoreSessionStorage();

    cy.login('admin', 'admin');
    cy.visit('fd2/soil_disturbance/');
    cy.waitForPage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
    cy.saveSessionStorage();
  });

  it('Location exists, is visible, is enabled', () => {
    cy.get('[data-cy="soil-disturbance-location"]').should('exist');
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-input"]')
      .should('be.visible')
      .should('be.enabled');
  });

  it('Location props are correct', () => {
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-required"]')
      .should('be.visible');
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-input"]')
      .should('have.value', null);
  });

  it('Location contains only fields and greenhouses with beds.', () => {
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-input"]')
      .find('option')
      .should('have.length', 12);
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-option-1"]')
      .should('have.value', 'A');
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-option-10"]')
      .should('have.value', 'GHANA');
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-option-11"]')
      .should('have.value', 'H');
  });

  it('Location validity styling works', () => {
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-input"]')
      .should('have.class', 'is-invalid');
  });

  it('Location shows termination checkbox and picklistBase table if active plant assets at location', () => {
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-input"]')
      .select('ALF');

    cy.get('[data-cy="termination-event-group-checkbox"]').should('be.visible');
    cy.get('[data-cy="termination-event-checkbox"]')
      .should('be.visible')
      .should('be.enabled');

    cy.get('[data-cy="termination-event-picklist"]').should('be.visible');
    cy.get('[data-cy="picklist-checkbox-0"]')
      .should('be.visible')
      .should('be.enabled');
    cy.get('[data-cy="picklist-checkbox-1"]')
      .should('be.visible')
      .should('be.enabled');
    cy.get('[data-cy="picklist-checkbox-2"]')
      .should('be.visible')
      .should('be.enabled');
  });

  it('Location shows termination checkbox and picklistBase table if active plant assets at location', () => {
    cy.get('[data-cy="soil-disturbance-location"]')
      .find('[data-cy="selector-input"]')
      .select('H');

    cy.get('[data-cy="picker-options"]').should('be.visible');
    cy.get('[data-cy="picker-options"]')
      .find('input')
      .eq(0)
      .should('be.enabled');
    cy.get('[data-cy="picker-options"]')
      .find('input')
      .eq(1)
      .should('be.enabled');

    cy.get('[data-cy="picker-options"]')
      .find('input')
      .eq(0)
      .should('be.checked');

    cy.get('[data-cy="picker-options"]')
      .find('input')
      .eq(1)
      .should('be.checked');
  });
});
