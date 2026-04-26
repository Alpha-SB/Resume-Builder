const express = require('express');

const {
  arrAllowedResumeItemTypes,
  getResumeList,
  getResumeById,
  getResumeItems,
  createResume,
  updateResume,
  deleteResume,
  replaceResumeItems,
  buildResumePreviewData
} = require('../../services/resume.service');
const { sendError } = require('../../utils/responseHelpers');
const { validateRequiredStringField, normalizeOptionalString } = require('../../utils/validators');
const { sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const sanitizeResumePayload = (objBody) => ({
  resume_name: sanitizePlainText(objBody.resume_name || ''),
  target_job_title: normalizeOptionalString(sanitizePlainText(objBody.target_job_title || '')),
  target_company: normalizeOptionalString(sanitizePlainText(objBody.target_company || '')),
  target_job_description: normalizeOptionalString(sanitizePlainText(objBody.target_job_description || ''))
});

const parsePositiveInteger = (value) => {
  const intValue = Number(value);
  if (!Number.isInteger(intValue) || intValue <= 0) {
    return null;
  }

  return intValue;
};

router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await getResumeList();
    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intResumeId = parsePositiveInteger(objRequest.params.id);
    if (!intResumeId) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objResume = await getResumeById(intResumeId);
    if (!objResume) {
      sendError(objResponse, 404, 'Resume not found.');
      return;
    }

    const arrItems = await getResumeItems(intResumeId);

    objResponse.json({
      resume: objResume,
      items: arrItems
    });
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:id/preview', async (objRequest, objResponse, fnNext) => {
  try {
    const intResumeId = parsePositiveInteger(objRequest.params.id);
    if (!intResumeId) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objPreviewData = await buildResumePreviewData(intResumeId);

    if (!objPreviewData) {
      sendError(objResponse, 404, 'Resume not found.');
      return;
    }

    objResponse.json(objPreviewData);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const strResumeNameError = validateRequiredStringField(
      objRequest.body || {},
      'resume_name',
      200
    );

    if (strResumeNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strResumeNameError] });
      return;
    }

    const objPayload = sanitizeResumePayload(objRequest.body || {});

    const objCreated = await createResume(objPayload);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intResumeId = parsePositiveInteger(objRequest.params.id);
    if (!intResumeId) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const strResumeNameError = validateRequiredStringField(
      objRequest.body || {},
      'resume_name',
      200
    );

    if (strResumeNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strResumeNameError] });
      return;
    }

    const objExisting = await getResumeById(intResumeId);
    if (!objExisting) {
      sendError(objResponse, 404, 'Resume not found.');
      return;
    }

    const objPayload = sanitizeResumePayload(objRequest.body || {});
    const objUpdated = await updateResume(intResumeId, objPayload);

    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/:id/items', async (objRequest, objResponse, fnNext) => {
  try {
    const intResumeId = parsePositiveInteger(objRequest.params.id);
    if (!intResumeId) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objExisting = await getResumeById(intResumeId);
    if (!objExisting) {
      sendError(objResponse, 404, 'Resume not found.');
      return;
    }

    if (!Array.isArray(objRequest.body?.items)) {
      sendError(objResponse, 400, 'items must be an array.');
      return;
    }

    const arrRawItems = objRequest.body.items;
    const arrValidatedItems = [];
    const setUniqueKeys = new Set();

    for (let intIndex = 0; intIndex < arrRawItems.length; intIndex += 1) {
      const objRawItem = arrRawItems[intIndex] || {};
      const strItemType = sanitizePlainText(objRawItem.item_type || '');
      const intItemId = parsePositiveInteger(objRawItem.item_id);
      const intSortOrderCandidate = Number(objRawItem.sort_order);
      const intSortOrder = Number.isInteger(intSortOrderCandidate)
        ? intSortOrderCandidate
        : intIndex;

      if (!arrAllowedResumeItemTypes.includes(strItemType)) {
        sendError(objResponse, 400, `Invalid item_type: ${strItemType || '(empty)'}.`);
        return;
      }

      if (!intItemId) {
        sendError(objResponse, 400, `Invalid item_id at index ${intIndex}.`);
        return;
      }

      const strUniqueKey = `${strItemType}:${intItemId}`;
      if (setUniqueKeys.has(strUniqueKey)) {
        continue;
      }

      setUniqueKeys.add(strUniqueKey);
      arrValidatedItems.push({
        item_type: strItemType,
        item_id: intItemId,
        sort_order: intSortOrder
      });
    }

    const arrSavedItems = await replaceResumeItems(intResumeId, arrValidatedItems);

    objResponse.json({
      resume_id: intResumeId,
      item_count: arrSavedItems.length,
      items: arrSavedItems
    });
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intResumeId = parsePositiveInteger(objRequest.params.id);
    if (!intResumeId) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await deleteResume(intResumeId);
    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Resume not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
