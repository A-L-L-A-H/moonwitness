# Human Preference Calibration

Preference compares traits, never prophets. The TypeScript engine estimates pairwise latent preference with a Bradley–Terry logistic model.

Public preference scoring remains `UNCALIBRATED` until both engineering gates are met:
- at least 100 pairwise observations;
- at least 30 unique respondents.

Passing the gate does not remove sampling-bias requirements.
