package com.mth.fastfood.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.fragment.app.Fragment;
import com.mth.fastfood.R;

public class BoardingStep2Fragment extends Fragment {
    
    private View mView;
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup parent, Bundle bundle) {
        
        mView = inflater.inflate(R.layout.fragment_boarding_step2, parent, false);
        
        return mView;
    }
    
}
