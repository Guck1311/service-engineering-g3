import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import type { MusicItem } from '@/api/types'
import MusicItemCard from '../MusicItemCard.vue'
import PaginationNav from '../PaginationNav.vue'
import ReactionControls from '../ReactionControls.vue'
import StarRating from '../StarRating.vue'

const ITEM: MusicItem = {
  id: 6,
  type: 'ALBUM',
  title: 'Abbey Road',
  artist: 'The Beatles',
  genre: 'Rock',
  releaseYear: 1969,
  durationSeconds: 2823,
  externalUrl: null,
  averageRating: 4.5,
  ratingCount: 2,
  trackCount: 3,
  createdAt: '2026-11-19T00:00:00.000Z',
  updatedAt: '2026-11-19T00:00:00.000Z',
}

describe('StarRating (v-model via defineModel)', () => {
  it('emits update:modelValue when a star is clicked', async () => {
    const wrapper = mount(StarRating, { props: { modelValue: 2 } })
    await wrapper.findAll('button')[3]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[4]])
  })

  it('shows filled, half and empty stars in readonly mode', () => {
    const wrapper = mount(StarRating, { props: { modelValue: 3.5, readonly: true } })
    expect(wrapper.findAll('button')).toHaveLength(0)
    const icons = wrapper.findAll('i').map((i) => i.classes().find((c) => c.startsWith('bi-star')))
    expect(icons).toEqual([
      'bi-star-fill',
      'bi-star-fill',
      'bi-star-fill',
      'bi-star-half',
      'bi-star',
    ])
  })
})

describe('ReactionControls (props down, events up)', () => {
  it('emits the clicked reaction', async () => {
    const wrapper = mount(ReactionControls, { props: { reaction: 'NONE', favourite: false } })
    await wrapper.get('button[title="Like"]').trigger('click')
    expect(wrapper.emitted('react')).toEqual([['LIKE']])
  })

  it('resets the active reaction to NONE when clicked again', async () => {
    const wrapper = mount(ReactionControls, { props: { reaction: 'DISLIKE', favourite: false } })
    await wrapper.get('button[title="Dislike"]').trigger('click')
    expect(wrapper.emitted('react')).toEqual([['NONE']])
  })

  it('emits toggleFavourite and reflects the props', async () => {
    const wrapper = mount(ReactionControls, { props: { reaction: 'LIKE', favourite: true } })
    expect(wrapper.get('button[title="Like"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('button[title="Favourite"]').classes()).toContain('btn-danger')

    await wrapper.get('button[title="Favourite"]').trigger('click')
    expect(wrapper.emitted('toggleFavourite')).toHaveLength(1)
  })
})

describe('PaginationNav (v-model:page)', () => {
  it('is hidden when everything fits on one page', () => {
    const wrapper = mount(PaginationNav, { props: { page: 1, total: 12, limit: 12 } })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders the pages and emits the selected one', async () => {
    const wrapper = mount(PaginationNav, { props: { page: 1, total: 30, limit: 12 } })
    const buttons = wrapper.findAll('.page-link')
    expect(buttons.map((b) => b.text())).toEqual(['', '1', '2', '3', ''])

    await buttons[3]!.trigger('click') // page 3
    // No parent listens to update:page here, so defineModel keeps 3 locally: "previous" -> 2
    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[3], [2]])
  })
})

describe('MusicItemCard (scoped slot)', () => {
  it('shows the item and passes it to the actions slot', () => {
    const wrapper = mount(MusicItemCard, {
      props: { item: ITEM },
      slots: {
        actions: `<template #actions="{ item }"><button>Add #{{ item.id }}</button></template>`,
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.text()).toContain('Abbey Road')
    expect(wrapper.text()).toContain('1969 · Rock · 3 tracks · 47:03')
    expect(wrapper.get('button').text()).toBe('Add #6')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: 'item-detail',
      params: { id: 6 },
    })
  })

  it('renders no footer without the slot', () => {
    const wrapper = mount(MusicItemCard, {
      props: { item: ITEM },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('.mt-auto').exists()).toBe(false)
  })
})
