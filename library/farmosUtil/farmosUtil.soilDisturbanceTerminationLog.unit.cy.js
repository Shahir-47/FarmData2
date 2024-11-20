import * as farmosUtil from './farmosUtil';

describe('Test the soil disturbance termination log functions', () => {
  let fieldMap = null;
  let bedMap = null;
  let categoryMap = null;

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.restoreSessionStorage();

    cy.wrap(farmosUtil.getFieldNameToAssetMap()).then((map) => {
      fieldMap = map;
    });

    cy.wrap(farmosUtil.getBedNameToAssetMap()).then((map) => {
      bedMap = map;
    });

    cy.wrap(farmosUtil.getLogCategoryToTermMap()).then((map) => {
      categoryMap = map;
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
    cy.saveSessionStorage();
  });

  it('Create a soil disturbance termination log for specific beds', () => {
    // Create a new plant asset
    cy.wrap(
      farmosUtil.createPlantAsset(
        '2023-11-20',
        'HERB-CILANTRO',
        'Test Plant Asset'
      )
    ).as('newPlantAsset');

    // Create a movement log to assign beds to the newly created plant asset
    cy.get('@newPlantAsset').then((plantAsset) => {
      const locationsArrayPromise = farmosUtil.getPlantingLocationObjects([
        'ALF',
        'ALF-1',
        'ALF-3',
      ]);
      const logCategoriesPromise = farmosUtil.getLogCategoryObjects([
        'seeding',
        'tillage',
      ]);

      cy.wrap(Promise.all([locationsArrayPromise, logCategoriesPromise])).then(
        ([locationsArray, logCategoriesArray]) => {
          const logName = `2023-11-20_activity_log_${plantAsset.id}`;
          const activityLogData = {
            type: 'log--activity',
            attributes: {
              name: logName,
              timestamp: '2023-11-20T00:00:00Z',
              status: 'done',
              is_movement: true,
            },
            relationships: {
              location: locationsArray,
              asset: [{ type: 'asset--plant', id: plantAsset.id }],
              category: logCategoriesArray,
            },
          };

          const activityLog = farmosUtil.getFarmOSInstance().then((farm) => {
            return farm.log.send(farm.log.create(activityLogData));
          });

          cy.wrap(activityLog).as('createdActivityLog');
        }
      );
    });

    // Validate that the movement log was created successfully
    cy.get('@createdActivityLog').then((activityLog) => {
      expect(activityLog.attributes.name).to.contain('activity_log');
      expect(activityLog.attributes.status).to.equal('done');
      expect(activityLog.attributes.is_movement).to.be.true;
    });

    // Create the soil disturbance termination log for a specific bed
    cy.get('@newPlantAsset').then((plantAsset) => {
      cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
        (updatedPlantAsset) => {
          cy.wrap(
            farmosUtil.createSoilDisturbanceTerminationLog(
              '2023-11-20',
              'ALF',
              ['ALF-1'], // Terminating ALF-1 only
              updatedPlantAsset // Use the updated plant asset
            )
          ).as('soilDisturbanceLog');
        }
      );
    });

    // Validate the soil disturbance termination log
    cy.get('@soilDisturbanceLog').then((soilDisturbanceLog) => {
      cy.wrap(
        farmosUtil.getSoilDisturbanceTerminationLog(soilDisturbanceLog.id)
      ).as('readSoilDisturbanceLog');
    });

    cy.getAll(['@readSoilDisturbanceLog', '@newPlantAsset']).then(
      ([soilDisturbanceLog, plantAsset]) => {
        expect(soilDisturbanceLog.attributes.name).to.equal(
          '2023-11-20_soil_disturbance_termination_' + plantAsset.id
        );
        expect(soilDisturbanceLog.attributes.timestamp).to.contain(
          '2023-11-20'
        );
        expect(soilDisturbanceLog.type).to.equal('log--activity');
        expect(soilDisturbanceLog.attributes.status).to.equal('done');
        expect(soilDisturbanceLog.attributes.is_movement).to.equal(true);

        expect(soilDisturbanceLog.relationships.location).to.have.length(2);
        expect(soilDisturbanceLog.relationships.location[0].id).to.equal(
          fieldMap.get('ALF').id
        );
        expect(soilDisturbanceLog.relationships.location[1].id).to.equal(
          bedMap.get('ALF-3').id
        ); // ALF-3 remains as it wasn't terminated

        expect(soilDisturbanceLog.relationships.asset).to.have.length(1);
        expect(soilDisturbanceLog.relationships.asset[0].id).to.equal(
          plantAsset.id
        );

        expect(soilDisturbanceLog.relationships.category).to.have.length(1);
        expect(soilDisturbanceLog.relationships.category[0].id).to.equal(
          categoryMap.get('termination').id
        );
      }
    );

    // Re-fetch and ensure the correct beds were removed for the plant asset
    cy.get('@newPlantAsset').then((plantAsset) => {
      cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
        (updatedPlantAsset) => {
          expect(updatedPlantAsset.relationships.location).to.have.length(2);
          expect(updatedPlantAsset.relationships.location[0].id).to.equal(
            fieldMap.get('ALF').id
          );
          expect(updatedPlantAsset.relationships.location[1].id).to.equal(
            bedMap.get('ALF-3').id
          ); // ALF-3 remains as it wasn't terminated
        }
      );
    });
  });

  it('Archive the plant asset when all beds are terminated', () => {
    // Create a new plant asset
    cy.wrap(
      farmosUtil.createPlantAsset(
        '2023-11-20',
        'HERB-CILANTRO',
        'Test Plant Asset for Archiving'
      )
    ).as('newPlantAsset');

    cy.get('@newPlantAsset').then((plantAsset) => {
      // Create a movement log to assign beds to the plant asset
      const locationsArrayPromise = farmosUtil.getPlantingLocationObjects([
        'ALF',
        'ALF-1',
        'ALF-3',
      ]);
      const logCategoriesPromise = farmosUtil.getLogCategoryObjects([
        'seeding',
        'tillage',
      ]);

      cy.wrap(Promise.all([locationsArrayPromise, logCategoriesPromise])).then(
        ([locationsArray, logCategoriesArray]) => {
          const logName = `2023-11-20_activity_log_${plantAsset.id}`;
          const activityLogData = {
            type: 'log--activity',
            attributes: {
              name: logName,
              timestamp: '2023-11-20T00:00:00Z',
              status: 'done',
              is_movement: true,
            },
            relationships: {
              location: locationsArray,
              asset: [{ type: 'asset--plant', id: plantAsset.id }],
              category: logCategoriesArray,
            },
          };

          const activityLog = farmosUtil.getFarmOSInstance().then((farm) => {
            return farm.log.send(farm.log.create(activityLogData));
          });

          cy.wrap(activityLog).as('createdActivityLog');
        }
      );
    });

    // Validate that the movement log was created successfully
    cy.get('@createdActivityLog').then((activityLog) => {
      expect(activityLog.attributes.name).to.contain('activity_log');
      expect(activityLog.attributes.status).to.equal('done');
      expect(activityLog.attributes.is_movement).to.be.true;
    });

    // Create the soil disturbance termination log for all beds
    cy.get('@newPlantAsset').then((plantAsset) => {
      cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
        (updatedPlantAsset) => {
          cy.wrap(
            farmosUtil.createSoilDisturbanceTerminationLog(
              '2023-11-20',
              'ALF',
              ['ALF-1', 'ALF-3'], // Terminate all beds
              updatedPlantAsset // Use the updated plant asset
            )
          ).as('soilDisturbanceLog');
        }
      );
    });

    // Validate the soil disturbance termination log
    cy.get('@soilDisturbanceLog').then((soilDisturbanceLog) => {
      cy.wrap(
        farmosUtil.getSoilDisturbanceTerminationLog(soilDisturbanceLog.id)
      ).as('readSoilDisturbanceLog');
    });

    // Ensure the plant asset is archived
    cy.get('@newPlantAsset').then((plantAsset) => {
      cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then((updatedAsset) => {
        expect(updatedAsset.attributes.status).to.equal('archived');
        expect(updatedAsset.relationships.location).to.have.length(1); // No beds, only location
      });
    });
  });

  it('Archive the plant asset with no beds', () => {
    // Create a new plant asset with no beds
    cy.wrap(
      farmosUtil.createPlantAsset(
        '2023-11-20',
        'HERB-CILANTRO',
        'Test Plant Asset with No Beds'
      )
    ).as('newPlantAsset');

    // Create a soil disturbance termination log
    cy.get('@newPlantAsset').then((plantAsset) => {
      cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
        (updatedPlantAsset) => {
          cy.wrap(
            farmosUtil.createSoilDisturbanceTerminationLog(
              '2023-11-20',
              'A', // Location
              [], // No beds to terminate
              updatedPlantAsset // Use the updated plant asset
            )
          ).as('soilDisturbanceLog');
        }
      );
    });

    // Ensure the plant asset is archived
    cy.get('@newPlantAsset').then((plantAsset) => {
      cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then((updatedAsset) => {
        expect(updatedAsset.attributes.status).to.equal('archived');
        expect(updatedAsset.relationships.location).to.have.length(1);
      });
    });
  });

  it(
    'Error creating a soil disturbance termination log for specific beds',
    { retries: 4 },
    () => {
      // Create a new plant asset
      cy.wrap(
        farmosUtil.createPlantAsset(
          '2023-11-20',
          'HERB-CILANTRO',
          'Test Plant Asset for Error Case'
        )
      ).as('newPlantAsset');

      // Assign beds to the plant asset via a movement log
      cy.get('@newPlantAsset').then((plantAsset) => {
        const locationsArrayPromise = farmosUtil.getPlantingLocationObjects([
          'CHUAU',
          'CHUAU-1',
          'CHUAU-3',
        ]);
        const logCategoriesPromise = farmosUtil.getLogCategoryObjects([
          'seeding',
        ]);

        cy.wrap(
          Promise.all([locationsArrayPromise, logCategoriesPromise])
        ).then(([locationsArray, logCategoriesArray]) => {
          const logName = `2023-11-20_activity_log_${plantAsset.id}`;
          const activityLogData = {
            type: 'log--activity',
            attributes: {
              name: logName,
              timestamp: '2023-11-20T00:00:00Z',
              status: 'done',
              is_movement: true,
            },
            relationships: {
              location: locationsArray,
              asset: [{ type: 'asset--plant', id: plantAsset.id }],
              category: logCategoriesArray,
            },
          };

          const activityLog = farmosUtil.getFarmOSInstance().then((farm) => {
            return farm.log.send(farm.log.create(activityLogData));
          });

          cy.wrap(activityLog).as('createdActivityLog');
        });
      });

      // Simulate an error while creating the soil disturbance termination log
      cy.intercept('POST', '**/api/log/activity', {
        statusCode: 401,
      });

      cy.get('@newPlantAsset').then((plantAsset) => {
        cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
          (updatedPlantAsset) => {
            cy.wrap(
              farmosUtil
                .createSoilDisturbanceTerminationLog(
                  '2023-11-20',
                  'CHUAU',
                  ['CHUAU-3'], // Attempt to terminate CHUAU-3
                  updatedPlantAsset
                )
                .then(() => {
                  throw new Error(
                    'Creating soil disturbance log should have failed.'
                  );
                })
                .catch((error) => {
                  expect(error.message).to.equal(
                    'Request failed with status code 401'
                  );
                })
            );
          }
        );
      });

      // Recheck the plant asset to ensure its state remains intact
      cy.get('@newPlantAsset').then((plantAsset) => {
        cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
          (updatedAsset) => {
            expect(updatedAsset.relationships.location).to.have.length(3); // Beds should remain intact
            expect(updatedAsset.attributes.status).to.not.equal('archived'); // Asset should not be archived
          }
        );
      });
    }
  );

  it(
    'Error creating a soil disturbance termination log for all beds',
    { retries: 4 },
    () => {
      // Create a new plant asset
      cy.wrap(
        farmosUtil.createPlantAsset(
          '2023-11-20',
          'HERB-CILANTRO',
          'Test Plant Asset for All Beds Error Case'
        )
      ).as('newPlantAsset');

      // Assign beds to the plant asset via a movement log
      cy.get('@newPlantAsset').then((plantAsset) => {
        const locationsArrayPromise = farmosUtil.getPlantingLocationObjects([
          'CHUAU',
          'CHUAU-1',
          'CHUAU-3',
        ]);
        const logCategoriesPromise = farmosUtil.getLogCategoryObjects([
          'seeding',
        ]);

        cy.wrap(
          Promise.all([locationsArrayPromise, logCategoriesPromise])
        ).then(([locationsArray, logCategoriesArray]) => {
          const logName = `2023-11-20_activity_log_${plantAsset.id}`;
          const activityLogData = {
            type: 'log--activity',
            attributes: {
              name: logName,
              timestamp: '2023-11-20T00:00:00Z',
              status: 'done',
              is_movement: true,
            },
            relationships: {
              location: locationsArray,
              asset: [{ type: 'asset--plant', id: plantAsset.id }],
              category: logCategoriesArray,
            },
          };

          const activityLog = farmosUtil.getFarmOSInstance().then((farm) => {
            return farm.log.send(farm.log.create(activityLogData));
          });

          cy.wrap(activityLog).as('createdActivityLog');
        });
      });

      // Simulate an error while creating the soil disturbance termination log
      cy.intercept('POST', '**/api/log/activity', {
        statusCode: 401,
      });

      cy.get('@newPlantAsset').then((plantAsset) => {
        cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
          (updatedPlantAsset) => {
            cy.wrap(
              farmosUtil
                .createSoilDisturbanceTerminationLog(
                  '2023-11-20',
                  'CHUAU',
                  ['CHUAU-1', 'CHUAU-3'], // Attempt to terminate all beds
                  updatedPlantAsset
                )
                .then(() => {
                  throw new Error(
                    'Creating soil disturbance log should have failed.'
                  );
                })
                .catch((error) => {
                  expect(error.message).to.equal(
                    'Request failed with status code 401'
                  );
                })
            );
          }
        );
      });

      // Recheck the plant asset to ensure its state remains intact
      cy.get('@newPlantAsset').then((plantAsset) => {
        cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
          (updatedAsset) => {
            expect(updatedAsset.relationships.location).to.have.length(3); // Beds should remain intact
            expect(updatedAsset.attributes.status).to.not.equal('archived'); // Asset should not be archived
          }
        );
      });
    }
  );

  it(
    'Error creating a soil disturbance termination log for a plant asset with no beds',
    { retries: 4 },
    () => {
      // Create a new plant asset with no beds
      cy.wrap(
        farmosUtil.createPlantAsset(
          '2023-11-20',
          'HERB-CILANTRO',
          'Test Plant Asset with No Beds'
        )
      ).as('newPlantAsset');

      // Simulate an error while creating the soil disturbance termination log
      cy.intercept('POST', '**/api/log/activity', {
        statusCode: 401,
      });

      cy.get('@newPlantAsset').then((plantAsset) => {
        cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
          (updatedPlantAsset) => {
            cy.wrap(
              farmosUtil
                .createSoilDisturbanceTerminationLog(
                  '2023-11-20',
                  'CHUAU', // Location
                  [], // No beds to terminate
                  updatedPlantAsset // Pass the plant asset with no beds
                )
                .then(() => {
                  throw new Error(
                    'Creating soil disturbance log for plant with no beds should have failed.'
                  );
                })
                .catch((error) => {
                  expect(error.message).to.equal(
                    'Request failed with status code 401'
                  );
                })
            );
          }
        );
      });

      // Recheck the plant asset to ensure its state remains intact
      cy.get('@newPlantAsset').then((plantAsset) => {
        cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
          (updatedAsset) => {
            expect(updatedAsset.relationships.location).to.have.length(0); // No beds should exist
            expect(updatedAsset.attributes.status).to.not.equal('archived'); // Asset should not be archived
          }
        );
      });
    }
  );

  it('Delete a soil disturbance termination log', () => {
    // Create a new plant asset
    cy.wrap(
      farmosUtil.createPlantAsset(
        '2023-11-20',
        'HERB-CILANTRO',
        'Test Plant Asset for Deletion'
      )
    ).as('newPlantAsset');

    cy.get('@newPlantAsset').then((plantAsset) => {
      // Create a movement log to assign beds
      const locationsArrayPromise = farmosUtil.getPlantingLocationObjects([
        'ALF',
        'ALF-1',
        'ALF-3',
      ]);
      const logCategoriesPromise = farmosUtil.getLogCategoryObjects([
        'seeding',
        'tillage',
      ]);

      cy.wrap(Promise.all([locationsArrayPromise, logCategoriesPromise])).then(
        ([locationsArray, logCategoriesArray]) => {
          const logName = `2023-11-20_activity_log_${plantAsset.id}`;
          const activityLogData = {
            type: 'log--activity',
            attributes: {
              name: logName,
              timestamp: '2023-11-20T00:00:00Z',
              status: 'done',
              is_movement: true,
            },
            relationships: {
              location: locationsArray,
              asset: [{ type: 'asset--plant', id: plantAsset.id }],
              category: logCategoriesArray,
            },
          };

          const activityLog = farmosUtil.getFarmOSInstance().then((farm) => {
            return farm.log.send(farm.log.create(activityLogData));
          });

          cy.wrap(activityLog).as('createdActivityLog');
        }
      );
    });

    // Validate that the movement log was created successfully
    cy.get('@createdActivityLog').then((activityLog) => {
      expect(activityLog.attributes.name).to.contain('activity_log');
      expect(activityLog.attributes.status).to.equal('done');
      expect(activityLog.attributes.is_movement).to.be.true;
    });

    // Create the soil disturbance termination log for a specific bed
    cy.get('@newPlantAsset').then((plantAsset) => {
      cy.wrap(farmosUtil.getPlantAsset(plantAsset.id)).then(
        (updatedPlantAsset) => {
          cy.wrap(
            farmosUtil.createSoilDisturbanceTerminationLog(
              '2023-11-20',
              'ALF',
              ['ALF-3'], // Terminate ALF-3
              updatedPlantAsset // Use the updated plant asset
            )
          ).as('soilDisturbanceLog');
        }
      );
    });

    // Validate the soil disturbance termination log
    cy.get('@soilDisturbanceLog').then((soilDisturbanceLog) => {
      cy.wrap(
        farmosUtil.getSoilDisturbanceTerminationLog(soilDisturbanceLog.id)
      ).as('readSoilDisturbanceLog');
    });

    cy.get('@readSoilDisturbanceLog').then((soilDisturbanceLog) => {
      expect(soilDisturbanceLog.attributes.name).to.contain(
        'soil_disturbance_termination'
      );
      expect(soilDisturbanceLog.attributes.status).to.equal('done');
    });

    // Delete the soil disturbance termination log
    cy.get('@soilDisturbanceLog').then((soilDisturbanceLog) => {
      cy.wrap(
        farmosUtil.deleteSoilDisturbanceTerminationLog(soilDisturbanceLog.id)
      ).then((result) => {
        expect(result.status).to.equal(204); // Successful deletion
      });
    });
  });

  it(
    'Error deleting a soil disturbance termination log',
    { retries: 4 },
    () => {
      cy.intercept('DELETE', '**/api/log/activity/*', {
        statusCode: 401,
      });

      cy.wrap(
        farmosUtil
          .deleteSoilDisturbanceTerminationLog('1234')
          .then(() => {
            throw new Error(
              'Deleting soil disturbance log should have failed.'
            );
          })
          .catch((error) => {
            expect(error.message).to.equal(
              'Request failed with status code 401'
            );
          })
      );
    }
  );
});
