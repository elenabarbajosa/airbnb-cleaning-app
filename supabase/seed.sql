-- Optional starter data

insert into public.next_cleaning_note (note)
select ''
where not exists (select 1 from public.next_cleaning_note);

