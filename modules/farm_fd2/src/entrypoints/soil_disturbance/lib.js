import * as farmosUtil from '@libs/farmosUtil/farmosUtil';

/**
 * Create the farmOS records (asset, quantities and log) to represent
 * a soil disturbance
 *
 * @param {Object} form the form containing the data from the entry point.
 * @returns {Promise} a promise that resolves when the records are successfully created.
 * The returned value is an object containing the asset, quantities and log that
 * were sent to the server.  This object has the properties shown below
 * where i indicates passes:
 * ```Javascript
 * {
 *   equipment: [ {asset--equipment} ],
 *   affectedPlants: [ {asset--plant} ],
 *   depth(i): {quantity--standard},
 *   speed(i): {quantity--standard},
 *   area(i): {quantity--standard},
 *   activityLog(i): {log--activity},
 * }
 * ```
 * @throws {Error} if an error occurs while creating the farmOS records.
 */
async function submitForm(formData) {
  try {
    let ops = [];
    const equipmentAssets = [];

    // Group by plant assets and save its corresponding beds to terminate
    let plantAssets = {};
    formData.picked.forEach((entry) => {
      const { uuid, bed } = entry.row;
      console.log('UUID:', uuid, 'Bed:', bed);

      if (!plantAssets[uuid]) {
        plantAssets[uuid] = {
          beds: [],
        };
      }

      if (bed !== 'N/A') {
        plantAssets[uuid].beds.push(bed);
      }
    });
    plantAssets = Object.entries(plantAssets); // [[uuid, {beds}]

    // if no active plant assets exist
    if (plantAssets.length === 0) {
      console.log('no plant');
      console.log(formData);
      console.log(plantAssets);
      const equipmentMap = await farmosUtil.getEquipmentNameToAssetMap();
      for (const equipmentName of formData.equipment) {
        equipmentAssets.push(equipmentMap.get(equipmentName));
      }

      for (let i = 0; i < formData.passes; i++) {
        const depthQuantity = {
          name: 'depthQuantity' + i,
          do: async () => {
            return await farmosUtil.createStandardQuantity(
              'length',
              formData.depth,
              'Depth',
              'INCHES'
            );
          },
          undo: async (results) => {
            await farmosUtil.deleteStandardQuantity(
              results['depthQuantity' + i].id
            );
          },
        };
        ops.push(depthQuantity);

        const speedQuantity = {
          name: 'speedQuantity' + i,
          do: async () => {
            return await farmosUtil.createStandardQuantity(
              'rate',
              formData.speed,
              'Speed',
              'MPH'
            );
          },
          undo: async (results) => {
            await farmosUtil.deleteStandardQuantity(
              results['speedQuantity' + i].id
            );
          },
        };
        ops.push(speedQuantity);

        const areaQuantity = {
          name: 'areaQuantity' + i,
          do: async () => {
            return await farmosUtil.createStandardQuantity(
              'ratio',
              formData.area,
              'Area',
              'PERCENT'
            );
          },
          undo: async (results) => {
            await farmosUtil.deleteStandardQuantity(
              results['areaQuantity' + i].id
            );
          },
        };
        ops.push(areaQuantity);

        const activityLog = {
          name: 'activityLog' + i,
          do: async (results) => {
            return await farmosUtil.createSoilDisturbanceActivityLog(
              formData.date,
              formData.location,
              formData.beds,
              formData.termination ? ['tillage', 'termination'] : ['tillage'],
              null,
              [
                results['depthQuantity' + i],
                results['speedQuantity' + i],
                results['areaQuantity' + i],
              ],
              equipmentAssets,
              'Pass ' +
                (i + 1) +
                ' of ' +
                formData.passes +
                '. ' +
                formData.comment
            );
          },
          undo: async (results) => {
            await farmosUtil.deleteSoilDisturbanceActivityLog(
              results['activityLog' + i].id
            );
          },
        };
        ops.push(activityLog);
      }
    } else {
      // if we have a active plant asset, then create a termination log (optional)
      // and a soil disturbance log (required) per plant asset
      for (let i = 0; i < plantAssets.length; i++) {
        const [uuid, { beds }] = plantAssets[i];

        console.log(uuid + ' ' + beds);

        if (formData.termination) {
          console.log('terminating.....');
          const terminationLog = {
            name: 'terminationLog' + i,
            do: async () => {
              return await farmosUtil.createSoilDisturbanceTerminationLog(
                formData.date,
                formData.location,
                beds.length > 0 ? beds : [],
                await farmosUtil.getPlantAsset(uuid)
              );
            },
            undo: async (results) => {
              await farmosUtil.deleteSoilDisturbanceTerminationLog(
                results['terminationLog' + i].id
              );
            },
          };
          ops.push(terminationLog);
        }

        const equipmentMap = await farmosUtil.getEquipmentNameToAssetMap();
        for (const equipmentName of formData.equipment) {
          equipmentAssets.push(equipmentMap.get(equipmentName));
        }

        for (let j = 0; j < formData.passes; j++) {
          const depthQuantity = {
            name: 'depthQuantity' + i + ' ' + j,
            do: async () => {
              return await farmosUtil.createStandardQuantity(
                'length',
                formData.depth,
                'Depth',
                'INCHES'
              );
            },
            undo: async (results) => {
              await farmosUtil.deleteStandardQuantity(
                results['depthQuantity' + i + ' ' + j].id
              );
            },
          };
          ops.push(depthQuantity);

          const speedQuantity = {
            name: 'speedQuantity' + i + ' ' + j,
            do: async () => {
              return await farmosUtil.createStandardQuantity(
                'rate',
                formData.speed,
                'Speed',
                'MPH'
              );
            },
            undo: async (results) => {
              await farmosUtil.deleteStandardQuantity(
                results['speedQuantity' + i + '' + j].id
              );
            },
          };
          ops.push(speedQuantity);

          const areaQuantity = {
            name: 'areaQuantity' + i + ' ' + j,
            do: async () => {
              return await farmosUtil.createStandardQuantity(
                'ratio',
                formData.area,
                'Area',
                'PERCENT'
              );
            },
            undo: async (results) => {
              await farmosUtil.deleteStandardQuantity(
                results['areaQuantity' + i + ' ' + j].id
              );
            },
          };
          ops.push(areaQuantity);

          const activityLog = {
            name: 'activityLog' + i + ' ' + j,
            do: async (results) => {
              return await farmosUtil.createSoilDisturbanceActivityLog(
                formData.date,
                formData.location,
                beds.length > 0 ? beds : [],
                formData.termination ? ['tillage', 'termination'] : ['tillage'],
                await farmosUtil.getPlantAsset(uuid),
                [
                  results['depthQuantity' + i + ' ' + j],
                  results['speedQuantity' + i + ' ' + j],
                  results['areaQuantity' + i + ' ' + j],
                ],
                equipmentAssets,
                'Pass ' +
                  (i + 1) +
                  ' of ' +
                  formData.passes +
                  ' of Plant Asset ' +
                  (j + 1) +
                  ' of ' +
                  plantAssets.length +
                  '. ' +
                  formData.comment
              );
            },
            undo: async (results) => {
              await farmosUtil.deleteSoilDisturbanceActivityLog(
                results['activityLog' + i + ' ' + j].id
              );
            },
          };
          ops.push(activityLog);
        }
      }
    }

    const result = await farmosUtil.runTransaction(ops);
    result['equipment'] = equipmentAssets;

    console.log(result);

    return result;
  } catch (error) {
    console.error('SoilDisturbance: \n' + error.message);
    console.error(error);

    let errorMsg = 'Error creating Soil Disturbance records.';

    for (const key of Object.keys(error.results)) {
      if (error.results[key]) {
        errorMsg +=
          '\n  Result of operation ' + key + ' could not be cleaned up.';
        if (
          error.results[key].attributes &&
          error.results[key].attributes.name
        ) {
          errorMsg += '\n   Manually delete log or asset with:';
          errorMsg += '\n     name: ' + error.results[key].attributes.name;
        } else {
          errorMsg += '\n   May be safely ignored';
        }
      }
    }

    throw Error(errorMsg, error);
  }
}

export const lib = {
  submitForm,
};
