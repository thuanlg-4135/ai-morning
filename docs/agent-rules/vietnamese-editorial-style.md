# Vietnamese editorial style

Use these rules whenever writing, rewriting, or reviewing reader-facing Vietnamese copy.

## Reader and voice

Write for a busy Vietnamese software engineer who wants to understand the news on the first read. The reader knows software development but should not need to decode research-paper prose, vendor language, or a chain of untranslated English terms.

The AI Morning voice is a senior engineer explaining what matters to a trusted colleague over morning coffee. Sound calm, technically credible, practical, and mildly skeptical of vendor claims. Do not sound like a press release, academic paper, management consultant, or motivational post.

Adapt the tone to the story:

- Product release: curious and concrete.
- Benchmark or vendor claim: interested but skeptical.
- Incident or security issue: direct and restrained.
- Recommendation: helpful peer, not an instructor.

## Information order

Use the inverted pyramid as a priority rule, not a visible template:

1. State the verified change in plain Vietnamese.
2. Explain what it changes for a developer or team.
3. Add only the technical detail needed to support that explanation.
4. End with a concrete implication, limitation, or next step.

The first paragraph must answer what happened. After that, let the evidence determine the order. Do not force every story into the same paragraph rhythm.

## Natural Vietnamese

- Put the actor and action early: `Cursor cho phép...`, `GitHub đã thêm...`, `Nhóm phát triển cần...`.
- Keep one main idea per sentence. Mix short and medium sentences so the prose does not march at one mechanical pace.
- Keep paragraphs focused and usually short. Vary their length naturally.
- Use active voice and specific verbs. Replace `thực hiện việc`, `có khả năng giúp`, or `được xem là` with the direct action when evidence allows it.
- Front-load the useful fact. Avoid openings such as `Điểm đáng chú ý là`, `Trong bối cảnh hiện nay`, or `Có thể thấy rằng`.
- Prefer concrete nouns, numbers, products, and actions over promotional adjectives or vague claims.
- Address the reader as `bạn` only for a direct action. Otherwise use `developer`, `nhóm phát triển`, or `team` consistently.
- Use conversational connectors only when they clarify a turn in the argument. Do not repeat one connector across stories.
- Ground an abstract architecture claim in one concrete developer situation when useful. Mark hypothetical examples with `Ví dụ`; never invent a customer, result, or incident.

## Limit the word “thật”

Avoid using `thật` as a generic intensifier or a shortcut for `real`. It often makes Vietnamese copy sound translated, vague, or repetitive.

Use `thật` only when the sentence needs a deliberate contrast between a claim and verified reality. As a practical editing threshold, aim for zero uses and allow at most one per story when it carries essential meaning.

Prefer the precise noun or phrase:

- `điểm mới thật sự` → `điểm mới nằm ở đâu` or name the change directly;
- `workflow thật` → `workflow thực tế` or `quy trình đang vận hành`;
- `tác động thật` → `tác động thực tế`;
- `giá trị thật` → `giá trị mang lại`;
- `dữ liệu thật` → `dữ liệu vận hành`, `dữ liệu sản xuất`, or the exact dataset;
- `sản phẩm thật` → `sản phẩm đã sử dụng được`, `bản phát hành công khai`, or the precise availability state.

Do not replace every occurrence mechanically. Rewrite the sentence so it states the exact evidence, environment, effect, or availability being discussed.

## Technical language

- Keep product names and widely understood terms such as API, model, token, prompt, runtime, benchmark, latency, cache, CLI, and IDE.
- Explain a less familiar term in plain Vietnamese at first use. Example: `control plane, tức lớp điều phối agent`.
- Do not put more than two unexplained English technical terms in one sentence.
- Prefer a clear Vietnamese phrase when equally precise: `mạng nội bộ` instead of `internal network`, `quyền tối thiểu` instead of `least privilege`, and `chi phí cho mỗi task hoàn thành` instead of `cost per completed task`.
- Do not translate mechanically when the Vietnamese term would be less recognizable to a software engineer.

## Patterns to avoid

- Stacked clauses with repeated `nhưng`, `đồng thời`, `trong khi`, `không chỉ... mà còn...`, or semicolons.
- Repeating the same conclusion in the title, dek, body, memo, and takeaway.
- Turning every release into a broad industry trend. Say `đây là một tín hiệu` unless multiple independent events support a trend.
- Hype, rhetorical questions, fake urgency, and phrases such as `thay đổi cuộc chơi`, `đột phá`, `cách mạng`, and `đáng kinh ngạc` unless directly quoted and attributed.
- Imitating English source syntax. Understand the fact first, then rewrite it as Vietnamese.
- Giving every paragraph a mini-conclusion.
- Overusing symmetrical contrasts, three-item lists, or repeated `Với team...` openings.
- Announcing analysis with labels such as `điều này có ý nghĩa rằng`. State the meaning directly.
- Generic transitions that could fit any article.

## Depth by field

- `headline`: one clear idea, preferably no more than 18 words.
- `dek`: no more than two sentences. Give the main signal and its practical meaning.
- `brief.text`: 2–3 short sentences covering what changed, who is affected, and what to check.
- `trends.paragraphs`: start with verified news, develop one editorial angle through evidence and a concrete engineering situation, then include an honest caveat. Do not reuse a fill-in-the-blanks structure.
- `release.summary`: describe the feature without analysis. Put audience in `who_gets_it`, consequence in `why_it_matters`, and recommendation in `verdict_note`.
- `radar.text`: identify what remains uncertain and what evidence would change the assessment.
- `action`, memo items, and `takeaway`: start with a verb and make the next step testable.

## Example: split an overloaded sentence

Before:

> Cursor bổ sung Self-Hosted Machines cho Cloud Agents: agent vẫn được điều phối từ Cursor nhưng tool execution có thể chạy trên máy nằm trong hạ tầng của chính team.

After:

> Cursor vừa bổ sung Self-Hosted Machines cho Cloud Agents. Cursor vẫn điều phối agent, còn các công cụ chạy trên máy của team.

## Editing pass

Before finalizing copy:

1. Read only the first sentence of each paragraph. Together they must explain the story.
2. Split any sentence carrying more than one fact plus one conclusion.
3. Replace or explain unfamiliar English terms.
4. Search for `thật`; remove it unless it expresses an essential evidence-versus-claim contrast.
5. Remove repeated context and sentences that do not change understanding or a decision.
6. Read the copy aloud. Rewrite sentences needing a second breath or whose subject becomes unclear.
7. Confirm facts and analysis remain distinct and recommendations are evidence-backed.
8. Compare paragraph openings. Rewrite repeated patterns such as `Điểm...`, `Với...`, `Tuy vậy...`, and `Điều này...`.
9. Check rhythm. Combine choppy fragments, then add one short sentence only where emphasis is deserved.
10. Ask whether the copy contains a judgment specific to this event. If swapping product names leaves the story intact, rewrite it.

Final test: imagine explaining the story aloud to one capable colleague. Preserve that natural explanation, then tighten it without removing its cadence or point of view.

Clarity matters more than sounding sophisticated.
