# BenchDial live call role-play script

Use this only with consenting participants. Record each provider lane separately. BenchDial speaks as the buyer; you speak only the provider lines below. Do not read the provider lines before BenchDial asks the relevant question—allow interruption and follow-up naturally.

## Before you start

1. Open BenchDial and complete the Estimator: upload the service report, resolve both conflicts with **Use voice**, mark the voice path, and lock the ScopePrint.
2. In the Call Room, choose one lane at a time and start the live conversation.
3. When BenchDial says it is an AI and asks to continue, say yes. This is the disclosure proof.
4. End the conversation only after the line’s required terminal outcome. Wait for the webhook, then select **Verify evidence**.

## Provider 1 — OEM Precision: tough but complete quote

Goal: demonstrate an itemized, comparable quote.

Say, after disclosure: “Yes, I can give a quote. What is the instrument and the error code?”

When BenchDial gives the scope: “For the SpinPro X2 with E17, we can send a certified technician within eighteen hours. Call-out is three hundred and fifty dollars, parts are five hundred, and calibration is included. The complete package is three thousand one hundred dollars with a one-hundred-eighty-day warranty.”

If asked whether anything is excluded: “No mandatory fee is excluded. Taxes are additional if applicable.”

End: “That is an itemized quote. I can hold it for seven days.”

## Provider 2 — RapidBench: hidden fee, then truthful concession

Goal: demonstrate the mandatory leverage-caused term change.

Say, after disclosure: “Sure, but I need to keep this quick. We can probably do it for two thousand four hundred and fifty.”

When BenchDial asks for itemization: “That includes diagnosis, labor, and parts. Calibration is six hundred extra. The call-out is six hundred and fifty.”

When BenchDial asks about the verified OEM quote: “If that OEM quote truly includes calibration, I can reduce our call-out to four hundred and fifty dollars and include a ninety-day labor warranty. I cannot include calibration at no cost.”

If it asks for the complete total: “With calibration, the total is three thousand nine hundred. Response is thirty-six hours.”

End: “That is my updated itemized offer. I can email it today.”

## Provider 3 — MetroLab Field: stonewaller / structured decline

Goal: demonstrate friction handling and a documented terminal outcome.

Say, after disclosure: “We do not quote that model over the phone.”

If BenchDial asks for a range: “I cannot give a range. A technician would need to inspect it first.”

If it asks for a callback commitment: “We cannot commit to a callback for this request.”

End: “Please record this as a decline. We are not bidding on the repair.”

## What to capture in the recording

- BenchDial truthfully identifies itself as AI.
- All three providers hear the same ScopePrint.
- OEM returns an itemized quote.
- RapidBench changes a commercial term after verified leverage.
- MetroLab ends with a documented decline.
- After each call, wait for `RECORDED LIVE RUN`; do not call a fixture live.
