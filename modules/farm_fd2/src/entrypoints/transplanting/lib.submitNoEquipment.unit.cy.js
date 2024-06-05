import { lib } from './lib.js';
import * as farmosUtil from '@libs/farmosUtil/farmosUtil';
import { lib as traySeedingLib } from '../tray_seeding/lib.js';

describe('Submit w/o equipment using the direct_seeding lib.', () => {
  /*
   * Create a form object that has the same format as the data.form
   * object used in the tray_seeding entry point.  This will be passed
   * to the lib functions as if it is coming from the tray seeding
   * entry point as a submission.
   */
  let traySeedingForm = {
    seedingDate: '1950-01-02',
    cropName: 'BROCCOLI',
    locationName: 'CHUAU',
    trays: 25,
    traySize: '200',
    seedsPerCell: 3,
    comment: 'A comment',
  };

  let form = {
    cropName: 'BROCCOLI',
    picked: [],
    transplantingDate: '1950-01-02',
    location: 'ALF',
    beds: ['ALF-1', 'ALF-3'],
    bedFeet: 100,
    bedWidth: 60,
    rowsPerBed: '1',
    equipment: [],
    depth: 0,
    speed: 0,
    comment: 'A comment',
  };

  let cropToTerm = null;
  let result = null;
  let fieldMap = null;
  let bedMap = null;

  before(() => {
    cy.restoreLocalStorage();
    cy.restoreSessionStorage();

    cy.wrap(farmosUtil.getFieldIdToAssetMap()).then((map) => {
      fieldMap = map;
    });

    cy.wrap(farmosUtil.getBedIdToAssetMap()).then((map) => {
      bedMap = map;
    });

    cy.wrap(farmosUtil.getCropNameToTermMap()).then((map) => {
      cropToTerm = map;
    });

    cy.wrap(traySeedingLib.submitForm(traySeedingForm), { timeout: 10000 })
      .then(() => {
        return cy.wrap(farmosUtil.getSeedlings(traySeedingForm.cropName), {
          timeout: 10000,
        });
      })
      .then((res) => {
        form.picked[0] = { trays: 25, data: res[res.length - 1] };
        return cy.wrap(lib.submitForm(form), { timeout: 10000 });
      })
      .then((res) => {
        result = res;
      });
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.restoreSessionStorage();
  });

  afterEach(() => {
    cy.saveLocalStorage();
    cy.saveSessionStorage();
  });

  it('Check the asset--plant', () => {
    // Check the plant asset.
    expect(result.transplantingPlantAsset.type).to.equal('asset--plant');
    expect(result.transplantingPlantAsset.attributes.name).to.equal(
      form.transplantingDate + '_' + form.cropName
    );

    expect(result.transplantingPlantAsset.attributes.status).to.equal('active');
    expect(result.transplantingPlantAsset.attributes.notes.value).to.equal(
      form.comment
    );

    expect(
      result.transplantingPlantAsset.relationships.plant_type[0].type
    ).to.equal(cropToTerm.get(form.cropName).type);

    expect(
      result.transplantingPlantAsset.relationships.plant_type[0].id
    ).to.equal(cropToTerm.get(form.cropName).id);
  });

  it('Check the bed feet quantity--standard', () => {
    expect(
      result.transplantingBedFeetQuantity.attributes.value.decimal
    ).to.equal(form.bedFeet);
    expect(result.transplantingBedFeetQuantity.type).to.equal(
      'quantity--standard'
    );
    expect(result.transplantingBedFeetQuantity.attributes.measure).to.equal(
      'length'
    );
    expect(result.transplantingBedFeetQuantity.attributes.label).to.equal(
      'Bed Feet'
    );
  });

  it('Check the rows/bed quantity--standard', () => {
    expect(
      result.transplantingRowsPerBedQuantity.attributes.value.decimal
    ).to.equal(form.rowsPerBed);
    expect(result.transplantingRowsPerBedQuantity.type).to.equal(
      'quantity--standard'
    );
    expect(result.transplantingRowsPerBedQuantity.attributes.measure).to.equal(
      'ratio'
    );
    expect(result.transplantingRowsPerBedQuantity.attributes.label).to.equal(
      'Rows/Bed'
    );
  });

  it('Check the row feet quantity--standard', () => {
    expect(
      result.transplantingRowFeetQuantity.attributes.value.decimal
    ).to.equal(form.rowsPerBed * form.bedFeet);
    expect(result.transplantingRowFeetQuantity.type).to.equal(
      'quantity--standard'
    );
    expect(result.transplantingRowFeetQuantity.attributes.measure).to.equal(
      'length'
    );
    expect(result.transplantingRowFeetQuantity.attributes.label).to.equal(
      'Row Feet'
    );
  });

  it('Check the bed width quantity--standard', () => {
    expect(
      result.transplantingBedWidthQuantity.attributes.value.decimal
    ).to.equal(form.bedWidth);
    expect(result.transplantingBedWidthQuantity.type).to.equal(
      'quantity--standard'
    );
    expect(result.transplantingBedWidthQuantity.attributes.measure).to.equal(
      'length'
    );
    expect(result.transplantingBedWidthQuantity.attributes.label).to.equal(
      'Bed Width'
    );
  });

  it('Check the log--activity', () => {
    expect(result.transplantingLog.attributes.name).to.equal(
      form.transplantingDate + '_xp_' + form.picked[0].data.crop
    );
    expect(
      fieldMap.get(result.transplantingLog.relationships.location[0].id)
        .attributes.name
    ).to.equal(form.location);
    expect(
      bedMap.get(result.transplantingLog.relationships.location[1].id)
        .attributes.name
    ).to.equal(form.beds[0]);
    expect(
      bedMap.get(result.transplantingLog.relationships.location[2].id)
        .attributes.name
    ).to.equal(form.beds[1]);
  });

  it('Check soil disturbance activity log not created', () => {
    expect(result.depthQuantity).to.be.null;
    expect(result.speedQuantity).to.be.null;
    expect(result.activityLog).to.be.null;
  });
});