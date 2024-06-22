import {describe, expect, test} from "vitest";
import {
    anySuitableResource,
    availabilityBlock,
    dayAndTimePeriod,
    errorResponse,
    fixedResourceAllocation,
    isoDate,
    requirementMatch,
    resource,
    resourceDayAvailability,
    resourceRequirementFns,
    resourceType,
    specificResource,
    success,
    time24,
    timePeriod
} from "../src/index.js";

const ball = resourceType("ball");
const unicorn = resourceType("unicorn");
const football = resource(ball, "Football");
const rugbyBall = resource(ball, "Rugby Ball");
const nineToTen = dayAndTimePeriod(isoDate(), timePeriod(time24("09:00"), time24("10:00")))
const tenToEleven = dayAndTimePeriod(isoDate(), timePeriod(time24("10:00"), time24("11:00")))

describe('resourceRequirementFns.matchRequirements', () => {

    test("returns nothing when no resources are required", () => {
        expect(resourceRequirementFns.matchRequirements([], nineToTen, [], [])).toEqual(success([]));
    });

    test("returns the resource when its available for the exact required time", () => {
        const availability = resourceDayAvailability(football, [availabilityBlock(nineToTen)]);
        const requirement = anySuitableResource(ball);
        expect(resourceRequirementFns.matchRequirements([availability], nineToTen, [requirement], [])).toEqual(success([{
            requirement,
            match: availability
        }]));
    })

    test("returns an error when the resource is not available", () => {
        const anyUnicorn = anySuitableResource(unicorn);
        expect(resourceRequirementFns.matchRequirements([resourceDayAvailability(football, [availabilityBlock(nineToTen)])], nineToTen, [anyUnicorn], []))
            .toEqual(errorResponse(resourceRequirementFns.errorCodes.noSuitableResource, `No suitable resource found for requirement id '${anyUnicorn.id.value}'`, anyUnicorn));
    })

    test("returns an error when the resource is available but not for the required time", () => {
        const anyBall = anySuitableResource(ball);
        expect(resourceRequirementFns.matchRequirements([resourceDayAvailability(football, [availabilityBlock(nineToTen)])], tenToEleven, [anyBall], []))
            .toEqual(errorResponse(resourceRequirementFns.errorCodes.noSuitableResource, `No suitable resource found for requirement id '${anyBall.id.value}'`, anyBall));
    })

    test("returns the specific resource when its available for the required time", () => {
        const availability = resourceDayAvailability(football, [availabilityBlock(nineToTen)]);
        const requirement = specificResource(football);
        expect(resourceRequirementFns.matchRequirements([availability], nineToTen, [requirement], []))
            .toEqual(success([{requirement, match: availability}]));
    })

    test("returns an error when the specific resource is not available for the required time", () => {
        const thisFootball = specificResource(football);
        expect(resourceRequirementFns.matchRequirements([resourceDayAvailability(football, [availabilityBlock(nineToTen)])], tenToEleven, [thisFootball], []))
            .toEqual(errorResponse(resourceRequirementFns.errorCodes.noSuitableResource, `No suitable resource found for requirement id '${thisFootball.id.value}'`, thisFootball));
    })

    test("resource is available for more than the required time", () => {
        const availability = resourceDayAvailability(football, [availabilityBlock(dayAndTimePeriod(isoDate(), timePeriod(time24("08:00"), time24("12:00"))))]);
        const requirement = specificResource(football);
        expect(resourceRequirementFns.matchRequirements([availability], nineToTen, [requirement], [])).toEqual(success([{
            requirement,
            match: availability
        }]));
    });

    test("resources can't be double booked", () => {
        const footballAvailable = resourceDayAvailability(football, [availabilityBlock(nineToTen)]);
        const anyBall = anySuitableResource(ball);
        expect(resourceRequirementFns.matchRequirements([footballAvailable], nineToTen, [anyBall, anyBall], []))
            .toEqual(errorResponse(resourceRequirementFns.errorCodes.noSuitableResource, `No suitable resource found for requirement id '${anyBall.id.value}' - it's already booked`, anyBall));

        const rugbyBallAvailable = resourceDayAvailability(rugbyBall, [availabilityBlock(nineToTen)]);
        expect(resourceRequirementFns.matchRequirements([footballAvailable, rugbyBallAvailable], nineToTen, [anyBall, anyBall], []))
            .toEqual(success([requirementMatch(anyBall, footballAvailable), requirementMatch(anyBall, rugbyBallAvailable)]));
    });

    test("can override any suitable requirement clauses", () => {
        const footballAvailable = resourceDayAvailability(football, [availabilityBlock(nineToTen)]);
        const rugbyBallAvailable = resourceDayAvailability(rugbyBall, [availabilityBlock(nineToTen)]);
        const specificFootball = specificResource(football);
        expect(resourceRequirementFns.matchRequirements([footballAvailable, rugbyBallAvailable], nineToTen, [specificFootball], [fixedResourceAllocation(specificFootball.id, rugbyBall.id)]))
            .toEqual(success([requirementMatch(specificFootball, rugbyBallAvailable)]));
    });
});
