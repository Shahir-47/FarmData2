import LocationSelector from '@comps/LocationSelector/LocationSelector.vue';
import * as farmosUtil from '@libs/farmosUtil/farmosUtil.js';

describe('Test the LocationSelector component events', () => {
  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.restoreSessionStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
    cy.saveSessionStorage();
  });

  /**
   * There are 6 cases for the valid event:
   *
   * Required     allowBedSelection   requireBedSelection   Test
   * false        false               false                 1. Not required, beds not allowed, beds not required
   * false        false               true                  Doesn't make sense
   * false        true                false                 2. Not required, beds allowed, beds not required
   * false        true                true                  3. Not required, beds allowed, beds required
   * true         false               false                 4. Required, beds not allowed, beds not required
   * true         false               true                  Doesn't make sense
   * true         true                false                 5. Required, beds allowed, beds not required
   * true         true                true                  6. Required, beds allowed, beds required
   */
  it('"valid" event: 1. Not required, beds not allowed, beds not required', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: false,
        allowBedSelection: false,
        requireBedSelection: false,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', true);
      });
  });

  it('"valid" event: 2. Not required, beds allowed, beds not required', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: false,
        allowBedSelection: true,
        requireBedSelection: false,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', true);
      });
  });

  it('"valid" event: 3. Not required, beds allowed, beds required', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: false,
        allowBedSelection: true,
        requireBedSelection: true,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', false);
      });
  });

  it('"valid" event: 4. Required, beds not allowed, beds not required', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: true,
        allowBedSelection: false,
        requireBedSelection: false,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', false);
      });
  });

  it('"valid" event:  5. Required, beds allowed, beds not required', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: true,
        allowBedSelection: true,
        requireBedSelection: false,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', false);
      });
  });

  it('"valid" event: 6. Required, beds allowed, beds required', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: true,
        allowBedSelection: true,
        requireBedSelection: true,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', false);
      });
  });

  it('"valid" event works when location selection changes validity', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: true,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', false);

        cy.get('[data-cy="selector-input"]').select('CHUAU');

        cy.get('@validSpy').should('have.been.calledTwice');
        cy.get('@validSpy').should('have.been.calledWith', true);
      });
  });

  it('"valid" event works when bed selection changes validity', () => {
    const readySpy = cy.spy().as('readySpy');
    const validSpy = cy.spy().as('validSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        required: true,
        allowBedSelection: true,
        requireBedSelection: true,
        onReady: readySpy,
        onValid: validSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', false);

        cy.get('[data-cy="selector-input"]').select('CHUAU');

        cy.get('@validSpy').should('have.been.calledOnce');
        cy.get('@validSpy').should('have.been.calledWith', false);

        // Pick CHUAU-1
        cy.get('[data-cy="picker-options"]').find('input').eq(0).check();

        cy.get('@validSpy').should('have.been.calledTwice');
        cy.get('@validSpy').should('have.been.calledWith', true);
      });
  });

  it('"update:selection" event is propagated', () => {
    const readySpy = cy.spy().as('readySpy');
    const updateSpy = cy.spy().as('updateSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        onReady: readySpy,
        'onUpdate:selected': updateSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('[data-cy="selector-input"]').select('CHUAU');
        cy.get('@updateSpy').should('have.been.calledOnce');
        cy.get('@updateSpy').should('have.been.calledWith', 'CHUAU');
      });
  });

  it('"update:beds" event is propagated', () => {
    const readySpy = cy.spy().as('readySpy');
    const updateSpy = cy.spy().as('updateSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        onReady: readySpy,
        'onUpdate:beds': updateSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('[data-cy="selector-input"]').select('CHUAU');
        cy.get('@updateSpy').should('not.have.been.called');

        // Pick CHUAU-1
        cy.get('[data-cy="picker-options"]').find('input').eq(0).check();

        cy.get('@updateSpy').should('have.been.calledOnce');
        cy.get('@updateSpy').should('have.been.calledWith', ['CHUAU-1'], 5);
      });
  });

  it('"update:availableBeds" event is emitted on initialization with selected location', () => {
    const readySpy = cy.spy().as('readySpy');
    const availableBedsSpy = cy.spy().as('availableBedsSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        selected: 'CHUAU',
        onReady: readySpy,
        'onUpdate:availableBeds': availableBedsSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // The component should emit the available beds when it's ready
        cy.get('@availableBedsSpy').should('have.been.calledOnce');

        // Verify that the emitted beds are correct for the selected location
        cy.get('@availableBedsSpy')
          .its('lastCall.args[0]')
          .should('deep.equal', [
            'CHUAU-1',
            'CHUAU-2',
            'CHUAU-3',
            'CHUAU-4',
            'CHUAU-5',
          ]);
      });
  });

  it('"update:availableBeds" event is emitted with the correct beds when location changes', () => {
    const readySpy = cy.spy().as('readySpy');
    const availableBedsSpy = cy.spy().as('availableBedsSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        onReady: readySpy,
        'onUpdate:availableBeds': availableBedsSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        // Since no location is selected initially and beds are empty, the event is not emitted
        cy.get('@availableBedsSpy').should('not.have.been.called');

        // Select a location
        cy.get('[data-cy="selector-input"]').select('CHUAU');

        // The component should emit the available beds when the location changes
        cy.get('@availableBedsSpy').should('have.been.calledOnce');

        // Verify that the emitted beds are correct
        cy.get('@availableBedsSpy')
          .its('lastCall.args[0]')
          .should('deep.equal', [
            'CHUAU-1',
            'CHUAU-2',
            'CHUAU-3',
            'CHUAU-4',
            'CHUAU-5',
          ]);
      });
  });

  it('Selected beds are cleared when location is changed', () => {
    const readySpy = cy.spy().as('readySpy');
    const updateSpy = cy.spy().as('updateSpy');

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        selected: 'CHUAU',
        pickedBeds: ['CHUAU-1', 'CHUAU-3'],
        onReady: readySpy,
        'onUpdate:beds': updateSpy,
      },
    });

    cy.get('@readySpy')
      .should('have.been.calledOnce')
      .then(() => {
        cy.get('[data-cy="selector-input"]').select('GHANA');

        cy.get('@updateSpy').should('have.been.calledThrice');
        cy.get('@updateSpy').its('args[2][0]').should('deep.equal', []);
        cy.get('@updateSpy').its('args[2][1]').should('equal', 4);

        cy.get('[data-cy="selector-input"]').select('CHUAU');

        cy.get('@updateSpy').its('callCount').should('equal', 4);
        cy.get('@updateSpy').its('args[3][0]').should('deep.equal', []);
        cy.get('@updateSpy').its('args[3][1]').should('equal', 5);
      });
  });

  it('"error" event is emitted when fetching fields (or beds) fails', () => {
    farmosUtil.clearCachedFields();

    const errorSpy = cy.spy().as('errorSpy');

    cy.intercept('GET', '**/api/asset/land?*', {
      forceNetworkError: true,
    });

    cy.mount(LocationSelector, {
      props: {
        includeFields: true,
        onError: errorSpy,
      },
    }).then(() => {
      cy.get('@errorSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', 'Unable to fetch locations.');
    });
  });

  it('"error" event is emitted when fetching greenhouses fails', () => {
    farmosUtil.clearCachedGreenhouses();

    const errorSpy = cy.spy().as('errorSpy');

    cy.intercept('GET', '**/api/asset/structure?*', {
      forceNetworkError: true,
    });

    cy.mount(LocationSelector, {
      props: {
        includeGreenhouses: true,
        onError: errorSpy,
      },
    }).then(() => {
      cy.get('@errorSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', 'Unable to fetch locations.');
    });
  });
});
