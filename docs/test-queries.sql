-- MenuCart tester week: queries for the hypotheses.
-- Run in the Supabase SQL editor (project → SQL Editor). Read-only.
--
-- How the data works
-- • One row per event in app_events. Only the live site records (not local runs or previews).
-- • tester_code comes from the invite link (?t=rina). Rows without one are people who
--   opened the app without a code (including us): add `and tester_code is not null`
--   to the WHERE clauses to see testers only.
-- • guest_id is a random id per phone; it stays the same after signing in, so it
--   counts "a person on a phone". user_id is set only when signed in.
-- • week_planned fires the first time a list is made for a week (per phone), with
--   planning_seconds = time from the first dish added to that week until the list.
--   It's empty when the week was only the sample menu or a copy with no dish added.
-- • occurred_at is the phone's time (events made offline arrive later).


-- 1. Second-week planners per tester (H2)
--    A tester "planned a second week" when lists were made for 2+ different weeks.
--    days_to_second shows how long after the first week's list the second came:
--    0 days usually means they planned next week in the same sitting.
with weeks as (
  select coalesce(tester_code, 'no code · ' || left(guest_id, 8)) as tester,
         props->>'week_start' as week_start,
         min(occurred_at) as planned_at
  from app_events
  where name = 'week_planned'
  group by 1, 2
), ranked as (
  select *, row_number() over (partition by tester order by planned_at) as n
  from weeks
)
select tester,
       count(*) as weeks_planned,
       count(*) >= 2 as planned_second_week,
       min(planned_at) filter (where n = 1) as first_list_at,
       min(planned_at) filter (where n = 2) as second_list_at,
       extract(day from min(planned_at) filter (where n = 2) - min(planned_at) filter (where n = 1)) as days_to_second,
       string_agg(week_start, ', ' order by week_start) as weeks
from ranked
group by tester
order by planned_second_week desc, tester;

--    H2 in one line: how many testers planned a second week.
select count(*) filter (where weeks >= 2) as testers_with_second_week,
       count(*) as testers_with_a_list
from (
  select tester_code, count(distinct props->>'week_start') as weeks
  from app_events
  where name = 'week_planned' and tester_code is not null
  group by tester_code
) t;


-- 2. Median planning time (H2: under 10 minutes?)
--    First dish added → first list, per week planned.
select round((percentile_cont(0.5) within group (order by (props->>'planning_seconds')::numeric) / 60)::numeric, 1) as median_minutes,
       count(*) as weeks_measured,
       count(*) filter (where (props->>'planning_seconds')::numeric <= 600) as weeks_under_10_min
from app_events
where name = 'week_planned'
  and props->>'planning_seconds' is not null;

--    The same per tester, to spot one long session skewing it (e.g. dish added Monday, list on Thursday).
select coalesce(tester_code, 'no code') as tester,
       props->>'week_start' as week_start,
       round((props->>'planning_seconds')::numeric / 60, 1) as minutes,
       (props->>'dish_count')::int as dishes
from app_events
where name = 'week_planned'
order by tester, week_start;


-- 3. Share of lists sent to WhatsApp (H3)
--    Per phone and week: was a list made, and was it sent (or copied) at least once?
with lists as (
  select distinct guest_id, tester_code, props->>'week_start' as week_start
  from app_events
  where name = 'week_planned'
), shared as (
  select guest_id, props->>'week_start' as week_start,
         bool_or(name = 'list_sent_whatsapp') as sent_whatsapp,
         bool_or(name = 'list_copied') as copied
  from app_events
  where name in ('list_sent_whatsapp', 'list_copied')
  group by 1, 2
)
select count(*) as lists,
       count(*) filter (where s.sent_whatsapp) as sent_whatsapp,
       round(100.0 * count(*) filter (where s.sent_whatsapp) / nullif(count(*), 0), 1) as pct_sent_whatsapp,
       count(*) filter (where s.copied) as copied,
       count(*) filter (where s.sent_whatsapp or s.copied) as sent_or_copied
from lists l
left join shared s using (guest_id, week_start);


-- 4. MenuCart Plus interest (H4)
--    Taps on "Daftar untuk akses awal", and how many different people tapped.
select count(*) as taps,
       count(distinct coalesce(tester_code, guest_id)) as people,
       count(*) filter (where props->>'where' = 'settings') as from_settings,
       count(*) filter (where props->>'where' = 'list') as from_list
from app_events
where name = 'plus_interest';


-- Extra: everything per tester at a glance (H1/H3 context).
select coalesce(tester_code, 'no code') as tester,
       count(*) filter (where name = 'dish_added') as dish_added,
       count(*) filter (where name = 'list_generated') as lists_generated,
       count(*) filter (where name = 'pantry_checked') as pantry_checked,
       count(*) filter (where name = 'list_sent_whatsapp') as sent_whatsapp,
       count(*) filter (where name = 'list_copied') as copied,
       count(*) filter (where name = 'item_ticked_while_shopping') as items_ticked_shopping,
       count(*) filter (where name = 'plus_interest') as plus_interest,
       bool_or((props->>'budget_set')::boolean) filter (where name = 'onboarding_completed') as set_budget,
       min(occurred_at) as first_seen,
       max(occurred_at) as last_seen
from app_events
group by 1
order by 1;
