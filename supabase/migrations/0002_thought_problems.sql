alter table public.challenges drop constraint if exists challenges_track_check;

insert into public.challenges (
  id,
  slug,
  title,
  track,
  difficulty,
  estimated_minutes,
  context,
  prompt,
  rubric_notes,
  tags
) values
(
  '11111111-1111-4111-8111-111111111111',
  'recursion-and-self-knowledge',
  'The Mirror Room',
  'identity',
  'Beginner',
  18,
  'You enter a room with three mirrors. The first shows your face, the second shows a recording of how you reacted to the first, and the third shows a stranger accurately describing the motives behind that reaction.',
  'Which mirror, if any, gives you the best knowledge of yourself? Argue whether self-knowledge depends more on first-person awareness, observed behavior, or interpretation by others.',
  array['Choose a clear account of what counts as self-knowledge.', 'Compare at least two sources of self-understanding.', 'Address how a person can be mistaken about their own motives.'],
  array['self-knowledge', 'reflection', 'identity']
),
(
  '22222222-2222-4222-8222-222222222222',
  'the-last-seat',
  'The Last Seat',
  'ethics',
  'Intermediate',
  22,
  'A rescue shuttle has one seat left. One candidate is likely to save many people later, one is the person who fixed the shuttle, and one was selected by a fair lottery before anyone knew their identities.',
  'Who should receive the last seat, and what makes that reason morally relevant? Defend a rule for choosing that you would still accept if you did not know which candidate you would be.',
  array['Identify the moral principle behind the choice.', 'Consider fairness, gratitude, and future consequences.', 'Answer an objection from one of the rejected candidates.'],
  array['triage', 'fairness', 'responsibility']
),
(
  '33333333-3333-4333-8333-333333333333',
  'the-memory-archive',
  'The Memory Archive',
  'identity',
  'Intermediate',
  24,
  'A patient can restore every lost memory from a perfect archive, but the archive also includes memories from a different person who lived a better life and consented to donate them.',
  'If the patient accepts the donated memories, do they become partly the donor, remain wholly themselves, or become someone new? Argue for a view of personal identity that can handle mixed memory.',
  array['Explain whether memory is evidence of identity or part of identity.', 'Distinguish psychological continuity from ownership of experience.', 'Consider whether consent changes the identity question.'],
  array['memory', 'personhood', 'continuity']
),
(
  '44444444-4444-4444-8444-444444444444',
  'promise-to-a-copy',
  'Promise to a Copy',
  'identity',
  'Advanced',
  28,
  'You promise to help a friend tomorrow. Overnight, a perfect copy of your friend appears, with the same memories and the same expectation that you will keep the promise.',
  'Do you owe the promise to the original, the copy, both, or neither until you can tell them apart? Defend an answer that explains what promises attach to.',
  array['Clarify whether promises attach to bodies, persons, histories, or relationships.', 'Address the possibility of duplicated claims.', 'Explain what would make one claim stronger than another.'],
  array['copies', 'promises', 'obligation']
),
(
  '55555555-5555-4555-8555-555555555555',
  'the-harmless-lie-machine',
  'The Harmless Lie Machine',
  'ethics',
  'Beginner',
  18,
  'A machine can tell each person one false but comforting sentence per day. The lies are designed never to affect decisions, only mood, and no one can discover that the machine lies.',
  'Would using the machine be morally wrong if it caused no practical harm? Argue whether truth matters only because of consequences or also because of respect for persons.',
  array['State whether harmless deception can still be wrong.', 'Explain the relation between truth, autonomy, and comfort.', 'Consider why someone might rationally prefer the pleasant lie.'],
  array['truth', 'harm', 'trust']
),
(
  '66666666-6666-4666-8666-666666666666',
  'the-fair-lottery',
  'The Fair Lottery',
  'ethics',
  'Intermediate',
  24,
  'A school must award one scholarship. The finalists are equally qualified, but one has overcome severe hardship, one will do the most public good, and one was randomly selected by a transparent lottery.',
  'When reasons run out or conflict, is a lottery the fairest solution or an abdication of judgment? Defend a standard for when randomness is morally appropriate.',
  array['Separate equality of procedure from equality of outcome.', 'Explain whether hardship or future benefit should break the tie.', 'Address the worry that lotteries hide responsibility.'],
  array['luck', 'desert', 'equality']
),
(
  '77777777-7777-4777-8777-777777777777',
  'the-sealed-testimony',
  'The Sealed Testimony',
  'knowledge',
  'Intermediate',
  24,
  'Ten reliable witnesses independently write down what happened in a sealed room. You cannot inspect the room, but all ten reports agree. Later, you learn the witnesses share the same teacher and vocabulary.',
  'How much should agreement among witnesses count as knowledge when their background may have shaped what they noticed? Argue for a view of testimony that avoids both cynicism and blind trust.',
  array['Explain why independent agreement can be evidence.', 'Consider how shared background can reduce independence.', 'Give a standard for rational trust in testimony.'],
  array['testimony', 'evidence', 'trust']
),
(
  '88888888-8888-4888-8888-888888888888',
  'the-perfect-map',
  'The Perfect Map',
  'knowledge',
  'Advanced',
  30,
  'A kingdom builds a map so detailed that every object, person, and motion appears on it in real time. The map is too large for any citizen to understand all at once.',
  'Can a representation be perfectly accurate and still fail to give understanding? Argue what must be added to accurate information for it to become knowledge.',
  array['Distinguish accuracy from intelligibility.', 'Explain the role of selection, scale, or purpose in understanding.', 'Address whether simplification can improve knowledge.'],
  array['representation', 'reality', 'understanding']
),
(
  '99999999-9999-4999-8999-999999999999',
  'the-forgotten-crime',
  'The Forgotten Crime',
  'identity',
  'Advanced',
  30,
  'A person committed a serious crime twenty years ago, then suffered an accident that erased all memory of it and permanently changed their character. The evidence is certain.',
  'Is punishment still justified when the guilty person no longer remembers the act and no longer has the character that produced it? Defend a view of responsibility across psychological change.',
  array['Clarify whether responsibility requires memory, character continuity, or bodily continuity.', 'Consider victims, deterrence, and desert separately.', 'Answer the objection that forgetting cannot erase guilt.'],
  array['responsibility', 'memory', 'punishment']
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'the-prediction-letter',
  'The Prediction Letter',
  'knowledge',
  'Beginner',
  20,
  'A sealed letter on your desk accurately predicts every choice you made yesterday. It also contains a prediction for what you will do next, but you can decide whether to open it.',
  'Would reading the prediction threaten your freedom, reveal a limit that was already there, or change nothing important? Argue what this case shows about choice and foreknowledge.',
  array['State what kind of freedom is at issue.', 'Explain whether prediction causes, reveals, or merely describes action.', 'Consider why the option to open the letter matters.'],
  array['free-will', 'prediction', 'choice']
),
(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'borrowed-pain',
  'Borrowed Pain',
  'ethics',
  'Intermediate',
  23,
  'A device lets healthy volunteers experience one hour of a patient''s pain. The experience cannot heal the patient, but it may make policy makers more compassionate.',
  'Is borrowing another person''s pain morally valuable, voyeuristic, or both? Argue whether empathy produced by simulation deserves moral authority.',
  array['Distinguish understanding suffering from using suffering.', 'Consider consent and the limits of simulated experience.', 'Explain whether empathy should guide policy.'],
  array['empathy', 'suffering', 'consent']
),
(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'the-private-language-app',
  'The Private Language App',
  'knowledge',
  'Advanced',
  28,
  'An app lets you create words for inner sensations that no one else can observe or correct. Over time, you rely on the app''s labels to make decisions about your feelings.',
  'Can a word have stable meaning if only one person can ever check its use? Argue whether private experience needs public criteria to become knowledge.',
  array['Explain what makes a word meaningful rather than merely habitual.', 'Consider whether inner experience can be checked by memory alone.', 'Address why public correction might matter for self-knowledge.'],
  array['language', 'meaning', 'privacy']
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  track = excluded.track,
  difficulty = excluded.difficulty,
  estimated_minutes = excluded.estimated_minutes,
  context = excluded.context,
  prompt = excluded.prompt,
  rubric_notes = excluded.rubric_notes,
  tags = excluded.tags;

alter table public.challenges
  add constraint challenges_track_check
  check (track in ('identity', 'ethics', 'knowledge'))
  not valid;
