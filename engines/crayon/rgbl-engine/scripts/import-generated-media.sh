#!/usr/bin/env bash
set -euo pipefail

SRC="${1:-.}"
STRICT="${CRAYON_MEDIA_STRICT:-1}"
MISSING=0

mkdir -p \
  media/opener \
  media/posters/allah \
  media/posters/human \
  media/posters/nature \
  media/posters/justice \
  media/posters/closing \
  media/audio \
  media/video \
  docs/research

copy_if_present() {
  local from="$1"
  local to="$2"
  if [[ -f "$SRC/$from" ]]; then
    cp "$SRC/$from" "$to"
    echo "✓ $from -> $to"
  else
    echo "✗ missing: $SRC/$from"
    MISSING=$((MISSING + 1))
  fi
}

copy_first_present() {
  local to="$1"
  shift
  local candidate
  for candidate in "$@"; do
    if [[ -f "$SRC/$candidate" ]]; then
      cp "$SRC/$candidate" "$to"
      echo "✓ $candidate -> $to"
      return 0
    fi
  done
  echo "✗ missing opener candidates: $*"
  MISSING=$((MISSING + 1))
}

# Prefer the user-selected production opener; keep the older poster as fallback.
copy_first_present "media/opener/crayon-sin-can-out-of-line.png" \
  "CRAYON_SIN-CAN_OPENER.png" \
  "out_of_line_back_to_mercy.png"

copy_if_present "crayon_allah_signs_to_recognition.png" "media/posters/allah/01-signs-to-recognition.png"
copy_if_present "crayon_reality_information_poster.png" "media/posters/allah/02-reality-information.png"
copy_if_present "g2_the_order_behind_knowledge.png" "media/posters/allah/03-governing-order-knowledge.png"
copy_if_present "being_meaning_and_human_agency.png" "media/posters/allah/04-being-meaning.png"
copy_if_present "the_big_question_exploring_every_possible_answer.png" "media/posters/allah/05-big-question.png"
copy_if_present "revelation_let_allah_speak.png" "media/posters/allah/06-revelation.png"
copy_if_present "recognition_not_measurement.png" "media/posters/allah/07-recognition-not-measurement.png"
copy_if_present "wisdom_loop_from_knowledge_to_action.png" "media/posters/allah/08-wisdom-action-return.png"

copy_if_present "crayon_human_self_choice_meaning.png" "media/posters/human/01-self-choice-meaning.png"
copy_if_present "crayon_infographic_understanding_human_states.png" "media/posters/human/02-reality-information.png"
copy_if_present "pola_berulang_dalam_kehidupan.png" "media/posters/human/03-pattern-knowledge.png"
copy_if_present "being_and_meaning_a_playful_life_map.png" "media/posters/human/04-being-meaning.png"
copy_if_present "the_big_human_question_purpose_and_proof.png" "media/posters/human/05-big-question.png"
copy_if_present "9_gate_human_inner_process.png" "media/posters/human/06-nine-gate.png"
copy_if_present "human_choice_sin_to_growth_cycle.png" "media/posters/human/07-sin-can-responsibility.png"
copy_if_present "human_wisdom_live_well.png" "media/posters/human/08-human-wisdom.png"

copy_if_present "crayon_nature_how_the_world_works.png" "media/posters/nature/01-reality-science-order.png"
copy_if_present "reality_information_nature_s_colorful_classroom.png" "media/posters/nature/02-reality-information.png"
copy_if_present "governing_patterns_in_nature.png" "media/posters/nature/03-governing-patterns.png"
copy_if_present "ecosystem_web_we_re_all_connected.png" "media/posters/nature/04-being-meaning-ecosystem.png"
copy_if_present "the_big_nature_question.png" "media/posters/nature/05-big-question.png"
copy_if_present "nature_observation_process_infographic.png" "media/posters/nature/06-nine-gate.png"
copy_if_present "crayon_environmental_choices_infographic.png" "media/posters/nature/07-care-responsibility.png"
copy_if_present "nature_wisdom_live_with_earth.png" "media/posters/nature/08-nature-wisdom.png"

copy_if_present "crayon_justice_what_is_fair.png" "media/posters/justice/01-what-is-fair.png"
copy_if_present "reality_check_facts_before_assumptions.png" "media/posters/justice/02-reality-information.png"
copy_if_present "patterns_rules_and_conflict_cycles.png" "media/posters/justice/03-patterns-rules.png"
copy_if_present "justice_concepts_being_and_meaning.png" "media/posters/justice/04-being-meaning.png"
copy_if_present "the_big_justice_question_poster.png" "media/posters/justice/05-big-question.png"
copy_if_present "9_gerbang_menuju_keadilan.png" "media/posters/justice/06-nine-gate.png"
copy_if_present "human_choice_justice_loop_infographic.png" "media/posters/justice/07-repair-responsibility.png"
copy_if_present "justice_wisdom_decide_fairly.png" "media/posters/justice/08-justice-wisdom.png"

copy_if_present "draw_again_a_crayon_learning_loop.png" "media/posters/closing/draw-again.png"
copy_if_present "crayon_funny_bgm_720.wav" "media/audio/crayon-funny-bgm.wav"
copy_if_present "CRAYON_VIDEO_WITH_BGM.mp4" "media/video/crayon-four-worlds-with-bgm.mp4"
copy_if_present "CRAYON_Framework_v1.9_EPISTEMIC_YIELD_WISDOM_INTEGRATION.docx" "docs/research/CRAYON-Framework-v1.9.docx"

if [[ "$STRICT" == "1" && "$MISSING" -gt 0 ]]; then
  echo
  echo "Media import incomplete: $MISSING required asset(s) missing."
  exit 2
fi

if command -v git-lfs >/dev/null 2>&1 || git lfs version >/dev/null 2>&1; then
  git lfs install
else
  echo "! Git LFS is not installed. Install it before committing production media."
  exit 3
fi

git add .gitattributes media/ docs/research/
echo
echo "Production media staged. Review with: git status"
echo "Then commit to dev, validate, and promote dev -> main."
