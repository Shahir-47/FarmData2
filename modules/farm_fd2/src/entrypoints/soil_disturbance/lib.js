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

    const affectedPlants = {
      name: 'affectedPlants',
      do: async () => {
        let affectedPlants = [];
        if (formData.termination) {
          for (const [, entry] of formData.picked.entries()) {
            const plantUuid = entry.row.uuid;

            // Find all picked beds for the current plant asset (identified by UUID)
            const pickedBeds = Array.from(formData.picked.values())
              .filter((pick) => pick.row.uuid === plantUuid)
              .map((pick) => pick.row.bed);

            // Retrieve plant asset to check its beds (if necessary)
            const plantAsset = await farmosUtil.getPlantAsset(plantUuid);

            // Check if all beds of the plantAsset are picked
            const allBedsChecked = plantAsset.beds.every((bed) =>
              pickedBeds.includes(bed)
            );
            const hasNoBeds =
              plantAsset.beds.length === 0 || pickedBeds.includes('N/A');

            if (allBedsChecked || hasNoBeds) {
              // Archive the plantAsset if all beds are checked or it has no beds
              affectedPlants.push(
                await farmosUtil.archivePlantAsset(plantUuid, true)
              );
            } else {
              // Store in the affectedPlants array if not fully archived
              affectedPlants.push(await farmosUtil.getPlantAsset(plantUuid));
            }
          }
        } else {
          // If not a termination event, retrieve the plant assets normally
          for (const [, entry] of formData.picked.entries()) {
            const plantUuid = entry.row.uuid;
            affectedPlants.push(await farmosUtil.getPlantAsset(plantUuid));
          }
        }
        return affectedPlants;
      },
      undo: async () => {
        if (formData.termination) {
          for (const [, entry] of formData.picked.entries()) {
            await farmosUtil.archivePlantAsset(entry.row.uuid, false);
          }
        }
      },
    };
    ops.push(affectedPlants);

    const equipmentMap = await farmosUtil.getEquipmentNameToAssetMap();
    for (const equipmentName of formData.equipment) {
      equipmentAssets.push(equipmentMap.get(equipmentName));
    }

    if (formData.affectedPlants.length === 0) {
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
              null, // No plantAsset
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
      console.log(formData.picked.entries().value.row.uuid);

      for (const uuid of uniqueUuids) {
        const plantAsset = await farmosUtil.getPlantAsset(uuid);

        const pickedBeds = Array.from(formData.picked.values())
          .filter((pick) => pick.row.uuid === uuid)
          .map((pick) => pick.row.bed);

        // Determine new beds for termination; otherwise, use picked beds for tillage
        const bedNames = formData.termination
          ? plantAsset.beds.length > 0
            ? plantAsset.beds.filter((bed) => !pickedBeds.includes(bed))
            : [] // Pass an empty array if no beds exist
          : pickedBeds; // Use picked beds for non-termination events

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
                bedNames,
                formData.termination ? ['tillage', 'termination'] : ['tillage'],
                plantAsset,
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
      }
    }

    const result = await farmosUtil.runTransaction(ops);
    result['equipment'] = equipmentAssets;

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
