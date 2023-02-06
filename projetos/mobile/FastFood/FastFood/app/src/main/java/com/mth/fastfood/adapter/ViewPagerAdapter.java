package com.mth.fastfood.adapter;

import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentStatePagerAdapter;
import com.mth.fastfood.adapter.ViewPagerAdapter;
import java.util.ArrayList;

public class ViewPagerAdapter extends FragmentStatePagerAdapter {
    
    private ArrayList<Fragment> array_list = new ArrayList<Fragment>();
    
    public ViewPagerAdapter(FragmentManager fm, ArrayList<Fragment> obj) {
        super(fm);
        this.array_list = obj;
    }
    
    public Fragment getItem(int position) {
        return this.array_list.get(position);
    }
    
    @Override
    public int getCount() {
        return this.array_list.size();
    }
    
}
