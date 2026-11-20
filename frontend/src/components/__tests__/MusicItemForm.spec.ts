import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { MusicItem } from '@/api/types'
import { formFromItem, toPayload, validateForm } from '@/utils/music-item-form'
import MusicItemForm from '../MusicItemForm.vue'

const ALBUM: MusicItem = {
  id: 6,
  type: 'ALBUM',
  title: 'Abbey Road',
  artist: 'The Beatles',
  genre: 'Rock',
  releaseYear: 1969,
  durationSeconds: 2823,
  externalUrl: null,
  averageRating: null,
  ratingCount: 0,
  trackCount: 3,
  createdAt: '2026-11-19T00:00:00.000Z',
  updatedAt: '2026-11-19T00:00:00.000Z',
}

describe('form logic (plain functions)', () => {
  it('converts an item into form fields and back', () => {
    const form = formFromItem(ALBUM)
    expect(form).toMatchObject({ minutes: 47, seconds: 3, trackCount: 3, externalUrl: '' })
    expect(toPayload(form)).toEqual({
      type: 'ALBUM',
      title: 'Abbey Road',
      artist: 'The Beatles',
      genre: 'Rock',
      releaseYear: 1969,
      durationSeconds: 2823,
      trackCount: 3,
    })
  })

  it('leaves out empty fields and trackCount of tracks', () => {
    const form = { ...formFromItem(), title: '  Yesterday ', trackCount: 5 as const }
    expect(toPayload(form)).toEqual({ type: 'TRACK', title: 'Yesterday' })
  })

  it('applies the backend rules', () => {
    const errors = validateForm({
      ...formFromItem(),
      type: 'PLAYLIST',
      title: ' ',
      releaseYear: 999,
      minutes: 0,
      seconds: 0,
      trackCount: -1,
      externalUrl: 'spotify:album:1',
    })
    expect(Object.keys(errors).sort()).toEqual([
      'duration',
      'externalUrl',
      'releaseYear',
      'title',
      'trackCount',
    ])
    expect(validateForm({ ...formFromItem(), title: 'Ok', seconds: 75 }).duration).toBeDefined()
    expect(validateForm(formFromItem(ALBUM))).toEqual({})
  })
})

describe('MusicItemForm component', () => {
  it('shows errors after submitting an invalid form and emits nothing', async () => {
    const wrapper = mount(MusicItemForm)
    expect(wrapper.find('.is-invalid').exists()).toBe(false) // not before the first submit

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('#title').classes()).toContain('is-invalid')
    expect(wrapper.text()).toContain('Title is required.')
  })

  it('emits the request body via v-model bound fields', async () => {
    const wrapper = mount(MusicItemForm)
    await wrapper.get('#type-ALBUM').setValue(true)
    await wrapper.get('#title').setValue('Help!')
    await wrapper.get('#year').setValue('1965')
    await wrapper.get('#tracks').setValue('14') // only rendered for albums/playlists

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [{ type: 'ALBUM', title: 'Help!', releaseYear: 1965, trackCount: 14 }],
    ])
  })

  it('hides the track count for tracks', () => {
    const wrapper = mount(MusicItemForm)
    expect(wrapper.find('#tracks').exists()).toBe(false)
  })

  it('locks the type when editing and exposes isDirty', async () => {
    const wrapper = mount(MusicItemForm, { props: { initial: ALBUM } })
    expect(wrapper.get<HTMLInputElement>('#title').element.value).toBe('Abbey Road')
    expect(wrapper.get('#type-TRACK').attributes('disabled')).toBeDefined()
    expect(wrapper.vm.isDirty).toBe(false)

    await wrapper.get('#title').setValue('Abbey Road (Remastered)')
    expect(wrapper.vm.isDirty).toBe(true)

    wrapper.vm.markSaved()
    expect(wrapper.vm.isDirty).toBe(false)
  })
})
