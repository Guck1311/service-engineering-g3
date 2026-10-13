import {describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import ReactionControls from '../ReactionControls.vue';

function buttons(wrapper: ReturnType<typeof mount>) {
  const [like, dislike, favourite] = wrapper.findAll('button');
  return {like: like!, dislike: dislike!, favourite: favourite!};
}

describe('ReactionControls', () => {
  it('emits LIKE, and NONE when the active reaction is clicked again', async () => {
    const wrapper = mount(ReactionControls, {
      props: {reaction: 'NONE', favourite: false},
    });
    await buttons(wrapper).like.trigger('click');
    await wrapper.setProps({reaction: 'LIKE'});
    await buttons(wrapper).like.trigger('click');

    expect(wrapper.emitted('change')).toEqual([
      [{reaction: 'LIKE'}],
      [{reaction: 'NONE'}],
    ]);
  });

  it('removes the favourite when a favourite is disliked', async () => {
    const wrapper = mount(ReactionControls, {
      props: {reaction: 'LIKE', favourite: true},
    });
    await buttons(wrapper).dislike.trigger('click');

    expect(wrapper.emitted('change')).toEqual([
      [{reaction: 'DISLIKE', favourite: false}],
    ]);
  });

  it('disables favourite while the item is disliked', () => {
    const wrapper = mount(ReactionControls, {
      props: {reaction: 'DISLIKE', favourite: false},
    });
    expect(buttons(wrapper).favourite.attributes('disabled')).toBeDefined();
  });
});
